param(
  [int]$StartPort = 3000,
  [int]$EndPort = 3010
)

foreach ($port in $StartPort..$EndPort) {
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    ForEach-Object {
      Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
