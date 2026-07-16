param(
    [string]$IndexUrl = "https://www.izs-sardegna.it/oldsite/cpt_index.cfm",
    [string]$PrivateOutput = "private/external/izs_bioresource/izs_bioresource_amr_records.json",
    [string]$PublicOutput = "public/data/izs_bioresource_amr_municipal.json",
    [string]$MunicipalityBoundaries = "public/geography/atlas_municipalities.geojson",
    [string]$PublicGeoJsonOutput = "public/data/izs_bioresource_amr_municipal.geojson"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function ConvertFrom-HtmlFragment {
    param([AllowEmptyString()][string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) { return "" }
    $withoutTags = [regex]::Replace($Value, "<[^>]+>", " ")
    $decoded = [System.Net.WebUtility]::HtmlDecode($withoutTags)
    return ([regex]::Replace($decoded, "\s+", " ")).Trim()
}

function Get-FirstMatchValue {
    param(
        [string]$Text,
        [string]$Pattern
    )
    $match = [regex]::Match($Text, $Pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    if (-not $match.Success) { return "" }
    return ConvertFrom-HtmlFragment $match.Groups[1].Value
}

function Get-NormalizedOrganismName {
    param([string]$Value)
    if ($Value -match '(?i)^(Staphylococcus|Streptococcus|Enterococcus)\s+([A-Za-z-]+)') {
        $genus = $Matches[1].Substring(0, 1).ToUpperInvariant() + $Matches[1].Substring(1).ToLowerInvariant()
        $species = $Matches[2].ToLowerInvariant()
        if ($species -in @("rosenbach")) { return "$genus spp." }
        return "$genus $species"
    }
    if ($Value -match '(?i)^Staphylococcus\b') { return "Staphylococcus spp." }
    return $Value
}

$indexResponse = Invoke-WebRequest -Uri $IndexUrl
$indexHtml = $indexResponse.Content
$recordChunks = [regex]::Split($indexHtml, '<tr><td height="1" colspan="5"')
$catalogueRecords = @()

foreach ($chunk in $recordChunks) {
    $idMatch = [regex]::Match($chunk, 'CPT_Bacteria\.cfm\?STR=(IZSSA_[^"&<]+)')
    if (-not $idMatch.Success) { continue }
    if ($chunk -notmatch '<span class="testo_rosso">ABG</span>') { continue }

    $textareas = [regex]::Matches($chunk, '<textarea[^>]*>(.*?)</textarea>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    if ($textareas.Count -lt 2) { continue }

    $recordId = $idMatch.Groups[1].Value
    $organismRaw = ConvertFrom-HtmlFragment $textareas[0].Groups[1].Value
    $organism = Get-NormalizedOrganismName $organismRaw
    $geographicOrigin = ConvertFrom-HtmlFragment $textareas[$textareas.Count - 1].Groups[1].Value
    if ($geographicOrigin -notmatch '(?i)Sardinia') { continue }

    $hostMaterial = Get-FirstMatchValue $chunk '</table>\s*</td>\s*<td>\s*([^<]*?/[^<]*?)\s*</td>\s*<td class="testo_rosso"'
    $hostCategory = ""
    $material = ""
    if ($hostMaterial -match '^\s*([^/]+)/\s*(.*)$') {
        $hostCategory = $Matches[1].Trim()
        $material = $Matches[2].Trim()
    }

    $province = ""
    $municipality = ""
    if ($geographicOrigin -match '(?i)Italy\s*,\s*Sardinia\s*,\s*([^/]+?)\s*/\s*([^/]+)') {
        $province = $Matches[1].Trim().ToUpperInvariant()
        $municipality = $Matches[2].Trim().ToUpperInvariant()
    }

    $detailUrl = "https://www.izs-sardegna.it/oldsite/CPT_Bacteria.cfm?STR=$recordId"
    $detailHtml = (Invoke-WebRequest -Uri $detailUrl).Content
    $antibiogramSection = Get-FirstMatchValue $detailHtml '(?s)<span class="sapevatepiccolo_R">Antibiogramma</span>(.*)<span class="note_vaccino">S</span>'
    if ([string]::IsNullOrWhiteSpace($antibiogramSection)) {
        $sectionMatch = [regex]::Match($detailHtml, '(?s)<span class="sapevatepiccolo_R">Antibiogramma</span>(.*)<span class="note_vaccino">S</span>')
        $antibiogramHtml = if ($sectionMatch.Success) { $sectionMatch.Groups[1].Value } else { "" }
    } else {
        $sectionMatch = [regex]::Match($detailHtml, '(?s)<span class="sapevatepiccolo_R">Antibiogramma</span>(.*)<span class="note_vaccino">S</span>')
        $antibiogramHtml = if ($sectionMatch.Success) { $sectionMatch.Groups[1].Value } else { "" }
    }

    $tests = @()
    foreach ($rowMatch in [regex]::Matches($antibiogramHtml, '(?s)<tr>\s*(.*?)</tr>')) {
        $cells = [regex]::Matches($rowMatch.Groups[1].Value, '(?s)<td[^>]*>(.*?)</td>')
        if ($cells.Count -lt 7) { continue }
        $method = ConvertFrom-HtmlFragment $cells[0].Groups[1].Value
        $antibiotic = ConvertFrom-HtmlFragment $cells[1].Groups[1].Value
        $result = ConvertFrom-HtmlFragment $cells[2].Groups[1].Value
        $testDate = ConvertFrom-HtmlFragment $cells[6].Groups[1].Value
        if ($result -notin @("Sensibile", "Intermedio", "Resistente")) { continue }
        $tests += [ordered]@{
            method = $method
            antibiotic = $antibiotic
            result = $result
            test_date = $testDate
        }
    }

    $catalogueRecords += [ordered]@{
        record_id = $recordId
        organism = $organism
        organism_raw = $organismRaw
        host = $hostCategory
        material = $material
        province = $province
        municipality = $municipality
        geographic_origin = $geographicOrigin
        antibiogram = $tests
        source_url = $detailUrl
    }
}

$retrievedAt = (Get-Date).ToString("yyyy-MM-dd")
$privateDataset = [ordered]@{
    source_id = "izs_sardegna_bioresource"
    retrieved_at = $retrievedAt
    source_index_url = $IndexUrl
    record_count = $catalogueRecords.Count
    records = $catalogueRecords
}

$publicRows = foreach ($record in $catalogueRecords) {
    foreach ($test in $record.antibiogram) {
        [pscustomobject]@{
            municipality = $record.municipality
            province = $record.province
            organism = $record.organism
            host = $record.host
            material = $record.material
            antibiotic = $test.antibiotic
            result = $test.result
            test_date = $test.test_date
            record_id = $record.record_id
        }
    }
}

$municipalGroups = $publicRows | Group-Object municipality, province, organism, host, material, antibiotic
$municipalAntibiograms = foreach ($group in $municipalGroups) {
    $first = $group.Group[0]
    $dates = @($group.Group.test_date | Where-Object { $_ } | Sort-Object -Unique)
    [ordered]@{
        municipality = $first.municipality
        province = $first.province
        organism = $first.organism
        host = $first.host
        material = $first.material
        antibiotic = $first.antibiotic
        tested = $group.Count
        resistant = @($group.Group | Where-Object result -eq "Resistente").Count
        intermediate = @($group.Group | Where-Object result -eq "Intermedio").Count
        susceptible = @($group.Group | Where-Object result -eq "Sensibile").Count
        test_dates = $dates
        source_record_count = @($group.Group.record_id | Sort-Object -Unique).Count
    }
}

$municipalSummary = foreach ($group in ($catalogueRecords | Group-Object { "$($_.municipality)|$($_.province)" })) {
    $first = $group.Group[0]
    $tests = @($group.Group | ForEach-Object { $_.antibiogram })
    [ordered]@{
        municipality = $first.municipality
        province = $first.province
        catalogue_isolates = $group.Count
        organisms = @($group.Group.organism | Sort-Object -Unique)
        resistant_test_results = @($tests | Where-Object result -eq "Resistente").Count
        total_test_results = $tests.Count
    }
}

$parsedTestDates = @($publicRows.test_date | Where-Object { $_ } | ForEach-Object {
    $parsed = [datetime]::MinValue
    if ([datetime]::TryParseExact($_, "dd/MM/yyyy", $null, [System.Globalization.DateTimeStyles]::None, [ref]$parsed)) { $parsed }
})
$testPeriod = if ($parsedTestDates.Count -gt 0) {
    [ordered]@{
        start = (($parsedTestDates | Measure-Object -Minimum).Minimum).ToString("yyyy-MM-dd")
        end = (($parsedTestDates | Measure-Object -Maximum).Maximum).ToString("yyyy-MM-dd")
    }
} else { $null }

$publicDataset = [ordered]@{
    source_id = "izs_sardegna_bioresource"
    dataset_version = "atlas-curated-v0.1"
    retrieved_at = $retrievedAt
    geography_level = "COMUNE_ORIGINE_CAMPIONE"
    record_count = $catalogueRecords.Count
    municipality_count = @($catalogueRecords.municipality | Where-Object { $_ } | Sort-Object -Unique).Count
    test_period = $testPeriod
    public_scope = "Aggregati comunali; localita e identificativi dei singoli ceppi esclusi."
    interpretation_note = "Collezione selettiva di ceppi con antibiogramma, non campione di sorveglianza. I conteggi documentano identificazioni comunali presenti nel catalogo e non stimano prevalenza, incidenza o rischio della popolazione comunale."
    source = [ordered]@{
        organization = "Istituto Zooprofilattico Sperimentale della Sardegna"
        title = "Bioresource IZSSA - Bacteria"
        index_url = $IndexUrl
    }
    municipalities = @($municipalSummary | Sort-Object municipality)
    antibiograms = @($municipalAntibiograms | Sort-Object municipality, organism, antibiotic)
}

$municipalityGeometry = Get-Content -Raw $MunicipalityBoundaries | ConvertFrom-Json
$municipalityFeatures = foreach ($summary in $municipalSummary) {
    $boundary = $municipalityGeometry.features | Where-Object { $_.properties.Nome -eq $summary.municipality } | Select-Object -First 1
    if (-not $boundary) {
        Write-Warning "Confine comunale non trovato: $($summary.municipality)"
        continue
    }
    $municipalityAntibiograms = @($municipalAntibiograms | Where-Object municipality -eq $summary.municipality)
    [ordered]@{
        type = "Feature"
        geometry = $boundary.geometry
        properties = [ordered]@{
            municipality = $summary.municipality
            province = $summary.province
            catalogue_isolates = $summary.catalogue_isolates
            organisms = $summary.organisms
            resistant_test_results = $summary.resistant_test_results
            total_test_results = $summary.total_test_results
            resistant_antibiotics = @($municipalityAntibiograms | Where-Object { $_.resistant -gt 0 } | ForEach-Object { $_.antibiotic } | Sort-Object -Unique)
            evidence_type = "collezione_selettiva_ceppi_ovini"
            interpretation_note = "Identificazioni comunali di catalogo; non prevalenza AMR comunale."
        }
    }
}
$publicGeoJson = [ordered]@{
    type = "FeatureCollection"
    name = "IZS Sardegna - evidenze AMR veterinarie comunali da Bioresource"
    source_id = "izs_sardegna_bioresource"
    features = @($municipalityFeatures)
}

$privateParent = Split-Path -Parent $PrivateOutput
$publicParent = Split-Path -Parent $PublicOutput
$geoJsonParent = Split-Path -Parent $PublicGeoJsonOutput
New-Item -ItemType Directory -Force -Path $privateParent, $publicParent, $geoJsonParent | Out-Null
$privateDataset | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 $PrivateOutput
$publicDataset | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 $PublicOutput
$publicGeoJson | ConvertTo-Json -Depth 100 -Compress | Set-Content -Encoding utf8 $PublicGeoJsonOutput

Write-Output "Private records: $($catalogueRecords.Count) -> $PrivateOutput"
Write-Output "Public municipalities: $($publicDataset.municipality_count) -> $PublicOutput"
Write-Output "Public map features: $(@($municipalityFeatures).Count) -> $PublicGeoJsonOutput"
