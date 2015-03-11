
-- --------------------------------------------------------
-- Add the ClientID and SenderCompID columns
-- See PLT-400 for history. 
--
ALTER TABLE `data` ADD COLUMN `ClientID` VARCHAR(128) NULL DEFAULT NULL  AFTER `SenderCompID` , ADD COLUMN `OnBehalfOfCompID` VARCHAR(128) NULL DEFAULT NULL  AFTER `TargetCompID` ;

-- --------------------------------------------------------
-- Schema version has been increased to cope with additional fields ClientID and OnBehalfOfCompID.
-- See PLT-400 for history. 
--
UPDATE `version`
SET
`major` = 1,
`minor` = 1
WHERE `major` = 1;
