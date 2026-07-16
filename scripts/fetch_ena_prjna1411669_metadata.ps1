param(
    [string]$ProjectAccession = "PRJNA1411669",
    [string]$OutputPath = "private/external/ena/prjna1411669_wgs_samples.tsv"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Invoke-EnaPortalQuery {
    param(
        [Parameter(Mandatory = $true)][string]$Result,
        [Parameter(Mandatory = $true)][string]$Query,
        [Parameter(Mandatory = $true)][string]$Fields
    )

    $base = "https://www.ebi.ac.uk/ena/portal/api/search"
    $uri = $base + "?result=" + [uri]::EscapeDataString($Result) +
        "&query=" + [uri]::EscapeDataString($Query) +
        "&fields=" + [uri]::EscapeDataString($Fields) +
        "&format=tsv&limit=0"

    $content = (Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 120).Content
    return @($content | ConvertFrom-Csv -Delimiter "`t")
}

$sampleFields = "accession,country,location,collection_date,scientific_name,isolation_source,study_accession,sample_alias"
$runFields = "run_accession,sample_accession,instrument_platform,library_strategy,library_source,library_layout,fastq_ftp,fastq_bytes"

$samples = Invoke-EnaPortalQuery -Result "sample" -Query "study_accession=`"$ProjectAccession`"" -Fields $sampleFields
$runs = Invoke-EnaPortalQuery -Result "read_run" -Query "study_accession=`"$ProjectAccession`" AND library_strategy=`"WGS`"" -Fields $runFields

$sampleByAccession = @{}
foreach ($sample in $samples) {
    $sampleByAccession[$sample.accession] = $sample
}

$rows = foreach ($run in $runs) {
    $sample = $sampleByAccession[$run.sample_accession]
    if ($null -eq $sample) {
        throw "Missing ENA sample metadata for $($run.sample_accession)"
    }

    $xmlUri = "https://www.ebi.ac.uk/ena/browser/api/xml/$($run.sample_accession)"
    [xml]$sampleXml = (Invoke-WebRequest -Uri $xmlUri -UseBasicParsing -TimeoutSec 120).Content
    $attributes = @{}
    foreach ($attribute in $sampleXml.SAMPLE_SET.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE) {
        $attributes[[string]$attribute.TAG] = [string]$attribute.VALUE
    }

    $scope = if ($sample.country -match "Lake Bidighinzu|Cabras Lagoon") {
        "field_water_body"
    } else {
        "experimental_or_other_not_for_public_map"
    }

    [pscustomobject]@{
        project_accession = $ProjectAccession
        run_accession = $run.run_accession
        sample_accession = $run.sample_accession
        sample_id = $attributes["Sample_ID"]
        geo_loc_name = $attributes["geo_loc_name"]
        lat_lon = $attributes["lat_lon"]
        collection_date = $sample.collection_date
        isolation_source = $sample.isolation_source
        scientific_name = $sample.scientific_name
        instrument_platform = $run.instrument_platform
        library_layout = $run.library_layout
        fastq_bytes = $run.fastq_bytes
        analysis_scope = $scope
        privacy = "restricted"
    }
}

$absoluteOutput = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputPath))
$outputDirectory = Split-Path -Parent $absoluteOutput
[System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
$rows | Sort-Object geo_loc_name, collection_date, sample_accession | Export-Csv -Path $absoluteOutput -Delimiter "`t" -NoTypeInformation -Encoding utf8

$fieldRows = @($rows | Where-Object analysis_scope -eq "field_water_body")
$privateRows = @($rows | Where-Object analysis_scope -ne "field_water_body")
$totalBytes = 0L
foreach ($row in $rows) {
    foreach ($value in ($row.fastq_bytes -split ";")) {
        if ($value) { $totalBytes += [int64]$value }
    }
}

[pscustomobject]@{
    project_accession = $ProjectAccession
    wgs_runs = $rows.Count
    field_water_body_runs = $fieldRows.Count
    experimental_or_other_runs = $privateRows.Count
    raw_fastq_gib = [math]::Round($totalBytes / 1GB, 2)
    restricted_output = $absoluteOutput
} | Format-List
