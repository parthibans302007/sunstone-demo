param (
    [Parameter(Mandatory=$true)]
    [string]$RepoUrl
)

Write-Host "Updating git remote origin to: $RepoUrl" -ForegroundColor Cyan

# Check if origin remote already exists
$remoteExists = git remote | Select-String "^origin$"

if ($remoteExists) {
    git remote set-url origin $RepoUrl
} else {
    git remote add origin $RepoUrl
}

Write-Host "Pushed code successfully staged. Pushing to main branch..." -ForegroundColor Cyan
git push -u origin main

Write-Host "Code successfully uploaded to the new repository!" -ForegroundColor Green
