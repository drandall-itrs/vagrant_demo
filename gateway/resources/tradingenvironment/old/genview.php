#!/usr/bin/php
<?php

// Usage:  genview <prefix>

// Files should exists like:
// <prefix>.<rowname>.<columnname>.txt
//
// There should also be a file <prefix>.rows.txt containing the first column name


$prefix = $argv[1];
$tableHeaders = "tableHeaderString";
$data = array();
$files = array();

if ($dh = opendir("."))
{
	while (($file = readdir($dh)) !== false)
	{
            $files[] = $file;
	}
	closedir($dh);
	sort($files); 
}

for ($i = 0; $i < count($files); ++$i) {
	if (!preg_match('/^'.$prefix.'\.(.*?)\.(.*?)\.txt$/', $files[$i], $matches)) continue;
	$data[$tableHeaders][$matches[2]] = true;
	$data[$matches[1]][$matches[2]] = trim(file_get_contents($files[$i]));
//	echo $files[$i];
//	echo "\n";
}

$ignore = 0;
$colname = 0;
echo trim(file_get_contents("/opt/geneos/gateway/resources/tradingenvironment/".$prefix.".rows.txt"));
foreach ($data[$tableHeaders] as $colname => $ignore)
	echo ",$colname";
echo "\n";

array_shift($data);

foreach ($data as $rowname => $row)
{
	echo $rowname;
	foreach ($row as $colname => $value)
		echo ",$value";
	echo "\n";
}
?>
