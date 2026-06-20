param (
    [Parameter(Mandatory=$true)]
    [string]$RepoUrl
)

if ([string]::IsNullOrWhiteSpace($RepoUrl)) {
    Write-Error "RepoUrl cannot be empty or whitespace."
    exit 1
}

Write-Host "Updating git remote origin to: $RepoUrl" -ForegroundColor Cyan

# Check if origin remote already exists
$remoteExists = git remote | Select-String "^origin$"

if ($remoteExists) {
    git remote set-url origin $RepoUrl
} else {
    git remote add origin $RepoUrl
}

# Get the current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to get current branch."
    exit 1
}

Write-Host "Current branch is: $currentBranch" -ForegroundColor Cyan

# Push to the current branch on the new origin
try {
    git push -u origin $currentBranch -ErrorAction Stop
    Write-Host "Code successfully uploaded to the new repository!" -ForegroundColor Green
} catch {
    Write-Error "Failed to push to the new repository. Error: $_"
    exit 1
}