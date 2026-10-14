Add-Type -AssemblyName System.Drawing

$width = 512
$height = 512
$bmp = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

$color = [System.Drawing.Color]::FromArgb(255, 0, 150, 245)
$pen = New-Object System.Drawing.Pen $color, 32
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

# Outer D shape
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddLine(172, 165, 285, 165)
# Arc bounding box: left = 285 - 91 = 194, top = 165, width = 182, height = 182. Sweep 270 to 180 degrees
$path.AddArc(194, 165, 182, 182, 270, 180)
$path.AddLine(285, 347, 172, 347)
$g.DrawPath($pen, $path)

# Inner vertical pill
$penPill = New-Object System.Drawing.Pen $color, 30
$penPill.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$penPill.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLine($penPill, 172, 236, 172, 288)

# Center dot
$brush = New-Object System.Drawing.SolidBrush $color
$g.FillEllipse($brush, 243, 259, 46, 46)

$outPath = Join-Path $PSScriptRoot "..\public\company-logo.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$brush.Dispose()
$penPill.Dispose()
$pen.Dispose()
$path.Dispose()
$g.Dispose()
$bmp.Dispose()

Write-Output "Successfully generated $outPath"
