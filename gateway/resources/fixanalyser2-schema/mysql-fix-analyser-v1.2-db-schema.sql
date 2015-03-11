use fixanalyser2;

-- --------------------------------------------------------
-- Table structure for table `data`
-- 
CREATE TABLE IF NOT EXISTS `data` (
  `TimeStamp` decimal(20,6) NOT NULL,
  `FileId` int(10) unsigned NOT NULL,  
  `SenderCompID` varchar(128) COLLATE latin1_bin NOT NULL,
  -- Some firms use ClientID instead of SenderCompID.  See PLT-400 for history.
  `ClientID` varchar(128) COLLATE latin1_bin DEFAULT NULL,
  `TargetCompID` varchar(128) COLLATE latin1_bin NOT NULL,
  -- Some firms use OnBehalfOfCompID instead of TargetCompID.  See PLT-400 for history.
  `OnBehalfOfCompID` varchar(128) COLLATE latin1_bin DEFAULT NULL,
  `MsgType` varchar(4) COLLATE latin1_bin NOT NULL,
  `ClOrdID` varchar(256) COLLATE latin1_bin DEFAULT NULL,
  `BuySideInst` varchar(128) COLLATE latin1_bin DEFAULT NULL,
  `BuySideField` int(11) DEFAULT NULL,
  `OrigClOrdID` varchar(256) COLLATE latin1_bin DEFAULT NULL,
  `Symbol` varchar(128) COLLATE latin1_bin DEFAULT NULL,
  `SecurityID` varchar(128) COLLATE latin1_bin DEFAULT NULL,
  `ExecType` varchar(4) COLLATE latin1_bin DEFAULT NULL,
  `OrdStatus` varchar(4) COLLATE latin1_bin DEFAULT NULL,
  `OrderQty` float DEFAULT NULL,
  `CumQty` float DEFAULT NULL,
  `FixMessage` varchar(2048) COLLATE latin1_bin NOT NULL,
  KEY `FileId` (`FileId`),
  KEY `MsgType` (`MsgType`),
  KEY `Order` (`ClOrdID`,`BuySideInst`,`BuySideField`),
  KEY `OrigOrder` (`OrigClOrdID`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_bin;

-- --------------------------------------------------------
-- Table structure for table `files`
--
CREATE TABLE IF NOT EXISTS `files` (
  `FileId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `Offset` bigint(20) NOT NULL,
  `Date` date NOT NULL,
  `File` varchar(1024) COLLATE latin1_bin NOT NULL,
  `Host` varchar(255) COLLATE latin1_bin NOT NULL,
  `UniqueFileID` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`FileId`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 COLLATE=latin1_bin AUTO_INCREMENT=1 ;

-- --------------------------------------------------------
-- Table structure for table `version`
--
CREATE TABLE IF NOT EXISTS `version` (
  `major` int(11) NOT NULL,
  `minor` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_bin;

-- --------------------------------------------------------
-- Schema version has been increased to cope with additional fields ClientID and OnBehalfOfCompID.
-- See PLT-400 for history. 
--
INSERT INTO `version` (`major`, `minor`) VALUES
(1, 2);

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

