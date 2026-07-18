param(
    [string]$OutputPath = "reports/pubmed_sardinia_amr_candidates.tsv"
)

$ErrorActionPreference = 'Stop'

$query = '((Sardinia[Title/Abstract]) OR Sardegna[Title/Abstract] OR Sardinian[Title/Abstract]) AND ((antimicrobial resistance[Title/Abstract]) OR (antibiotic resistance[Title/Abstract]) OR (antimicrobial susceptibility[Title/Abstract]) OR resistome[Title/Abstract] OR carbapenemase*[Title/Abstract] OR multidrug-resistant[Title/Abstract])'
$repoRoot = Split-Path -Parent $PSScriptRoot
$curatedPath = Join-Path $repoRoot 'metadata/LITERATURE_CURATED.tsv'
$decisionsPath = Join-Path $repoRoot 'metadata/LITERATURE_SEARCH_DECISIONS.tsv'
$destination = Join-Path $repoRoot $OutputPath

if (-not (Test-Path -LiteralPath $curatedPath)) {
    throw "Registro curato non trovato: $curatedPath"
}

$curatedPmids = @{}
Import-Csv -LiteralPath $curatedPath -Delimiter "`t" | ForEach-Object {
    if ($_.pmid) { $curatedPmids[$_.pmid.Trim()] = $true }
}

# Decisions retain an audit trail for screened candidates deliberately excluded
# from the public curated registry. A curated record always takes precedence.
$decisions = @{}
if (Test-Path -LiteralPath $decisionsPath) {
    Import-Csv -LiteralPath $decisionsPath -Delimiter "`t" | ForEach-Object {
        if ($_.pmid) { $decisions[$_.pmid.Trim()] = $_ }
    }
}

$base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
$search = Invoke-RestMethod -Uri "$base/esearch.fcgi" -Method Get -Body @{ db = 'pubmed'; term = $query; retmax = 500; retmode = 'json' }
$ids = @($search.esearchresult.idlist)

if ($ids.Count -eq 0) {
    throw 'La ricerca PubMed non ha restituito record.'
}

$summary = Invoke-RestMethod -Uri "$base/esummary.fcgi" -Method Get -Body @{ db = 'pubmed'; id = ($ids -join ','); retmode = 'json' }
$retrieved = (Get-Date).ToString('yyyy-MM-dd')

$rows = foreach ($id in $ids) {
    $record = $summary.result.$id
    $decision = $decisions[$id]
    $status = if ($curatedPmids.ContainsKey($id)) { 'already_curated' } elseif ($null -ne $decision -and $decision.decision) { $decision.decision } else { 'needs_manual_review' }
    $reason = if ($curatedPmids.ContainsKey($id)) {
        'Already present in metadata/LITERATURE_CURATED.tsv.'
    } elseif ($null -ne $decision -and $decision.reason) {
        $decision.reason
    } else {
        'Discovery candidate only; scope, Sardinia-specificity, data granularity and public-safety must be screened manually.'
    }
    [pscustomobject]@{
        pmid = $id
        title = $record.title
        journal = $record.fulljournalname
        publication_date = $record.pubdate
        doi = (($record.articleids | Where-Object { $_.idtype -eq 'doi' } | Select-Object -First 1).value)
        status = $status
        reason = $reason
        search_date = $retrieved
        query = $query
        source_url = "https://pubmed.ncbi.nlm.nih.gov/$id/"
    }
}

$parent = Split-Path -Parent $destination
if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
$rows | Export-Csv -LiteralPath $destination -Delimiter "`t" -NoTypeInformation -Encoding utf8
Write-Host "Wrote $($rows.Count) PubMed discovery records to $destination"