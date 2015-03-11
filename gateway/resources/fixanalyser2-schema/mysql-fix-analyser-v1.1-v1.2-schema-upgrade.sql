-- --------------------------------------------------------
-- Data management procedure.
-- Culls data older than the specified threshold.
delimiter $$
CREATE PROCEDURE `removeExpiredFiles`(IN `daysOld` int)
BEGIN
	-- Remove data and files,
	-- where file date is older then the threshold
	DELETE FROM `files`, `data`
	USING `files`
	LEFT JOIN `data` ON `data`.`FileId` = `files`.`FileId`
	WHERE TIMESTAMPDIFF(DAY, `files`.`Date`, NOW()) > `daysOld`;
END$$

-- --------------------------------------------------------
-- Add an extra index to the data table for improved search performance
--
CREATE INDEX `OrigOrder` ON `data` (`OrigClOrdID`);

-- --------------------------------------------------------
-- Schema version has been increased to cope with new housekeeping routines
--
UPDATE `version`
SET
`major` = 1,
`minor` = 2
WHERE `major` = 1;

