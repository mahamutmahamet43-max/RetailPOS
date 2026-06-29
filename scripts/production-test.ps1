param(
    [string]$BaseUrl = "https://retailpos-sigma.vercel.app",
    [string]$Email = "admin@retailpos.com",
    [string]$Password = "password123"
)

$ts = Get-Date -Format "yyyyMMddHHmmssfff"
$Global:PassCount = 0
$Global:FailCount = 0
$Global:Step = 0
$Global:Session = $null
$Global:CategoryId = $null
$Global:ProductId = $null
$Global:CustomerId = $null
$Global:SupplierId = $null
$Global:PurchaseId = $null
$Global:BackupId = $null

function Test-Step {
    param([string]$Name, [ScriptBlock]$Block)
    $Global:Step++
    Write-Host ""
    Write-Host "[$($Global:Step)] $Name..." -ForegroundColor Cyan
    try {
        & $Block
        $Global:PassCount++
        Write-Host "  [PASS]" -ForegroundColor Green
    } catch {
        $Global:FailCount++
        Write-Host "  [FAIL] $_" -ForegroundColor Red
    }
}

function Invoke-Api {
    param([string]$Method = "GET", [string]$Path, $Body = $null)
    $headers = @{ "Content-Type" = "application/json" }
    
    $params = @{
        Uri = "$BaseUrl$Path"
        Method = $Method
        Headers = $headers
        WebSession = $Global:Session
        UseBasicParsing = $true
    }
    if ($Body) {
        $json = if ($Body -is [string]) { $Body } else { $Body | ConvertTo-Json -Depth 10 }
        $params["Body"] = $json
    }
    
    try {
        $r = Invoke-WebRequest @params
        $content = try { $r.Content | ConvertFrom-Json } catch { $r.Content }
        return @{ Status = [int]$r.StatusCode; Data = $content }
    } catch {
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errBody = $reader.ReadToEnd()
            $reader.Close()
            $statusCode = [int]$_.Exception.Response.StatusCode
            $errData = try { $errBody | ConvertFrom-Json } catch { $errBody }
            return @{ Status = $statusCode; Data = $errData; Error = $errBody }
        }
        throw $_
    }
}

# ========================
# LOGIN
# ========================
Test-Step "Login with admin credentials" {
    $Global:Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $r = Invoke-WebRequest -Uri "$BaseUrl/api/auth/csrf" -WebSession $Global:Session -UseBasicParsing
    $csrf = ($r.Content | ConvertFrom-Json).csrfToken
    
    $form = @{
        csrfToken = $csrf
        email = $Email
        password = $Password
        callbackUrl = "$BaseUrl/en/dashboard"
    }
    try {
        $r = Invoke-WebRequest -Uri "$BaseUrl/api/auth/callback/credentials" -Method Post -Body $form -WebSession $Global:Session -UseBasicParsing -MaximumRedirection 0 -ErrorAction SilentlyContinue
    } catch {}
    
    $sessionCookie = $Global:Session.Cookies.GetCookies("$BaseUrl/") | Where-Object { $_.Name -like "*session*" }
    if (-not $sessionCookie) { throw "No session cookie received" }
}

# ========================
# CATEGORIES
# ========================
Test-Step "Create category (unique name)" {
    $result = Invoke-Api -Method POST -Path "/api/categories" -Body @{ name = "Test-Cat-$ts"; description = "Prod test" }
    if ($result.Status -ne 201) { throw "Expected 201, got $($result.Status): $($result.Data | ConvertTo-Json)" }
    $Global:CategoryId = $result.Data.id
}

Test-Step "List categories" {
    $result = Invoke-Api -Path "/api/categories"
    if ($result.Status -ne 200) { throw "Expected 200" }
    $found = $result.Data | Where-Object { $_.id -eq $Global:CategoryId }
    if (-not $found) { throw "Category not found in list" }
}

# ========================
# PRODUCTS
# ========================
Test-Step "Create product with unique barcode" {
    $body = @{
        name = "Test-Prod-$ts"
        categoryId = $Global:CategoryId
        costPrice = 5.00
        sellingPrice = 10.00
        stockQuantity = 100
        minimumStock = 10
        barcode = "BRC-$ts"
        unit = "pcs"
        isActive = $true
    }
    $result = Invoke-Api -Method POST -Path "/api/products" -Body $body
    if ($result.Status -ne 201) { throw "Expected 201, got $($result.Status): $($result.Data | ConvertTo-Json)" }
    $Global:ProductId = $result.Data.id
}

Test-Step "Search product by name" {
    $result = Invoke-Api -Path "/api/products?search=Test-Prod-$ts"
    if ($result.Status -ne 200) { throw "Expected 200" }
    if ($result.Data.products.Count -eq 0) { throw "No products found" }
}

Test-Step "Search product by barcode" {
    $result = Invoke-Api -Path "/api/products?search=BRC-$ts"
    if ($result.Status -ne 200) { throw "Expected 200" }
    if ($result.Data.products.Count -eq 0) { throw "Product not found by barcode" }
}

# ========================
# CUSTOMERS
# ========================
Test-Step "Create customer (unique phone)" {
    $body = @{
        firstName = "John-$ts"
        lastName = "Doe"
        phone = "+2526$ts"
        email = "john.$ts@test.com"
    }
    $result = Invoke-Api -Method POST -Path "/api/customers" -Body $body
    if ($result.Status -ne 201) { throw "Expected 201, got $($result.Status): $($result.Data | ConvertTo-Json)" }
    $Global:CustomerId = $result.Data.id
}

Test-Step "List customers" {
    $result = Invoke-Api -Path "/api/customers"
    if ($result.Status -ne 200) { throw "Expected 200" }
    $found = $result.Data.customers | Where-Object { $_.id -eq $Global:CustomerId }
    if (-not $found) { throw "Customer not found" }
}

# ========================
# SUPPLIERS
# ========================
Test-Step "Create supplier" {
    $body = @{
        name = "Test-Supplier-$ts"
        phone = "+2527$ts"
        email = "supplier.$ts@test.com"
    }
    $result = Invoke-Api -Method POST -Path "/api/suppliers" -Body $body
    if ($result.Status -ne 201) { throw "Expected 201, got $($result.Status): $($result.Data | ConvertTo-Json)" }
    $Global:SupplierId = $result.Data.id
}

# ========================
# PURCHASE
# ========================
Test-Step "Create COMPLETED purchase" {
    $body = @{
        invoiceNumber = "INV-$ts"
        supplierId = $Global:SupplierId
        supplierName = "Test-Supplier-$ts"
        status = "COMPLETED"
        items = @(@{
            productId = $Global:ProductId
            productName = "Test-Prod-$ts"
            quantity = 50
            costPrice = 5.00
            unitName = "pcs"
            unitConversionFactor = 1
        })
    }
    $result = Invoke-Api -Method POST -Path "/api/purchases" -Body $body
    if ($result.Status -ne 201) { throw "Expected 201, got $($result.Status): $($result.Data | ConvertTo-Json)" }
    $Global:PurchaseId = $result.Data.id
}

Test-Step "Verify inventory: 100 -> 150" {
    $result = Invoke-Api -Path "/api/products?search=Test-Prod-$ts"
    $product = $result.Data.products | Where-Object { $_.id -eq $Global:ProductId } | Select-Object -First 1
    if (-not $product) { throw "Product not found" }
    if ($product.stockQuantity -ne 150) { throw "Expected stock 150, got $($product.stockQuantity)" }
}

Test-Step "View inventory transactions" {
    $result = Invoke-Api -Path "/api/inventory"
    if ($result.Status -ne 200) { throw "Expected 200" }
}

# ========================
# SALES - ALL 5 PAYMENT METHODS
# ========================
$paymentMethods = @("CASH", "ZAAD", "EVC_PLUS", "SAHAL", "CARD")
$saleResults = @{}

foreach ($pm in $paymentMethods) {
    Test-Step "Sale payment: $pm" {
        $saleBody = @{
            items = @(@{
                productId = $Global:ProductId
                productName = "Test-Prod-$ts"
                barcode = "BRC-$ts"
                quantity = 2
                unitPrice = 10.00
                discount = 0
                productUnitId = $null
                unitName = "pcs"
                unitConversionFactor = 1
            })
            customerId = $Global:CustomerId
            paymentMethod = $pm
            amountPaid = 25.00
            discount = 0
            tax = 0
        }
        
        $result = Invoke-Api -Method POST -Path "/api/sales" -Body $saleBody
        if ($result.Status -ne 201) { throw "Expected 201, got $($result.Status): $($result.Data | ConvertTo-Json)" }
        $saleResults[$pm] = @{
            id = $result.Data.id
            saleNumber = $result.Data.saleNumber
        }
    }
}

# ========================
# VERIFY
# ========================
Test-Step "Inventory: 150 -> 140 after 5 sales x 2 items" {
    $result = Invoke-Api -Path "/api/products?search=Test-Prod-$ts"
    $product = $result.Data.products | Where-Object { $_.id -eq $Global:ProductId } | Select-Object -First 1
    if ($product.stockQuantity -ne 140) { throw "Expected stock 140, got $($product.stockQuantity)" }
}

Test-Step "All 5 sales in list" {
    $result = Invoke-Api -Path "/api/sales"
    if ($result.Status -ne 200) { throw "Expected 200" }
    $foundCount = 0
    foreach ($pm in $paymentMethods) {
        $s = $result.Data.sales | Where-Object { $_.id -eq $saleResults[$pm].id } | Select-Object -First 1
        if ($s) { $foundCount++ }
    }
    if ($foundCount -ne 5) { throw "Expected 5 sales, found $foundCount" }
}

Test-Step "Sales report" {
    $result = Invoke-Api -Path "/api/reports/sales"
    if ($result.Status -ne 200) { throw "Expected 200" }
}

Test-Step "Payment methods report" {
    $result = Invoke-Api -Path "/api/reports/payment-methods"
    if ($result.Status -ne 200) { throw "Expected 200" }
}

Test-Step "Dashboard report" {
    $result = Invoke-Api -Path "/api/reports/dashboard"
    if ($result.Status -ne 200) { throw "Expected 200" }
}

# ========================
# CUSTOMER
# ========================
Test-Step "Customer search by name" {
    $result = Invoke-Api -Path "/api/customers?search=John-$ts"
    if ($result.Status -ne 200) { throw "Expected 200" }
    $found = $result.Data.customers | Where-Object { $_.id -eq $Global:CustomerId } | Select-Object -First 1
    if (-not $found) { throw "Customer not found" }
}

# ========================
# BACKUP
# ========================
Test-Step "Create backup" {
    $result = Invoke-Api -Method POST -Path "/api/admin/backups"
    if ($result.Status -notin @(200, 201)) { throw "Expected 200/201, got $($result.Status): $($result.Data | ConvertTo-Json)" }
    $Global:BackupId = $result.Data.backup.id
}

Test-Step "List backups" {
    $result = Invoke-Api -Path "/api/admin/backups"
    if ($result.Status -ne 200) { throw "Expected 200" }
    $found = $result.Data.backups | Where-Object { $_.id -eq $Global:BackupId } | Select-Object -First 1
    if (-not $found) { throw "Backup not found in list" }
}

Test-Step "Delete backup" {
    $result = Invoke-Api -Method DELETE -Path "/api/admin/backups/$Global:BackupId"
    if ($result.Status -ne 200) { throw "Expected 200, got $($result.Status): $($result.Data | ConvertTo-Json)" }
}

Test-Step "Backup deletion verified" {
    $result = Invoke-Api -Path "/api/admin/backups"
    $found = $result.Data.backups | Where-Object { $_.id -eq $Global:BackupId } | Select-Object -First 1
    if ($found) { throw "Backup still exists" }
}

# ========================
# STORE SETTINGS
# ========================
Test-Step "Get store settings" {
    $result = Invoke-Api -Path "/api/settings/store"
    if ($result.Status -ne 200) { throw "Expected 200" }
}

# ========================
# HEALTH
# ========================
Test-Step "Health check" {
    $r = Invoke-WebRequest -Uri "$BaseUrl/api/health" -UseBasicParsing
    if ($r.StatusCode -ne 200) { throw "Expected 200" }
}

Test-Step "Health counts (authenticated)" {
    $result = Invoke-Api -Path "/api/health/counts"
    if ($result.Status -ne 200) { throw "Expected 200, got $($result.Status)" }
}

# ========================
# SUMMARY
# ========================
Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "  TEST RESULTS SUMMARY - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "  Total tests : $($Global:Step)" -ForegroundColor White
Write-Host "  Passed      : $Global:PassCount" -ForegroundColor Green
if ($Global:FailCount -gt 0) {
    Write-Host "  Failed      : $Global:FailCount" -ForegroundColor Red
} else {
    Write-Host "  Failed      : 0" -ForegroundColor Green
}
Write-Host ("=" * 60) -ForegroundColor Cyan

if ($Global:FailCount -gt 0) {
    Write-Host ""
    Write-Host "SOME TESTS FAILED" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host ""
    Write-Host "ALL TESTS PASSED - Production ready!" -ForegroundColor Green
    exit 0
}
