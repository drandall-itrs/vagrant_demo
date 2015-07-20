#!/usr/bin/perl
#---------------------------------------------
# Written by Edu A. Morales ITRS AMERICA INC. &copy 2008-2013
#_____________________________________________

use strict;
use warnings;

# Host and port of webslinger
my $webslingerHost = '192.168.142.20:8081';
# WebSlinger attribute list.  This should match the configured webslinger VIEW_PATH
my @attributes = ('COUNTRY','CATEGORY','APPLICATION');
#---------------------------------------------
# If you create a symlink to this action and name it to contain escalate then it
# will set this flag for use in the subject if it is used in an action
#_____________________________________________
my $escalate = $0 =~ /escalate/ ? 'E' : '';
    
#---------------------------------------------
# Create and set some variables
my ($email,$infoMessage,$subject,$sev,$rowClass);
# set the from email address, if not defined use default
my $from = defined $ENV{'_EMAIL_FROM'} ? $ENV{'_EMAIL_FROM'} : "alerts\@itrsgroup.com";
my $outputFile="/tmp/Mail$$.html";
$email="drandall\@itrsgroup.com";


# example Date: Fri, 15 Aug 2008 15:45:20 -0400 (EDT)
my $dateString = `date +"%a, %d %b %Y %H:%M:%S %z"`;
chomp ($dateString);
#_____________________________________________

#---------------------------------------------
# Set recipients
# if this is defined then it is a user assignment email
# If used in this manner it takes an argument that should be something descriptive
#  either assigned or unassigned
#if (defined $ENV{'_ASSIGNEE_EMAIL'} ) {
#    $email = $ENV{'_ASSIGNEE_EMAIL'};

#    my $assign = $0 =~ /unassign/ ? 'unassigned' : 'assigned';

#    $infoMessage = "You have been $assign this task by $ENV{'_ASSIGNER_USERNAME'}.<br>\n";
#}
#else {
#    # standard alert email
#    $email = defined $ENV{'eMail'} ? $ENV{'eMail'} : join(",",@ARGV);
#    # allow the user to cutomize the body, if not use default.
#    # this does not let the user define variables in the supplied body
#    $infoMessage = defined $ENV{'_EMAIL_BODY'} ? $ENV{'_EMAIL_BODY'} : 'This Message has been generated by the ITRS monitoring application.<br>
#For more information on problem resolutions, escalation procedures and contact numbers please visit the support homepage.<br>';
#}
#_____________________________________________


#---------------------------------------------
# Create a smart subject

#-----
# Create shorthand severity to be used in subject 
# Will look like (OK),( C),( W),(EC),(EW) 
#$sev = $ENV{'_SEVERITY'} eq 'OK' ? 'OK' : $escalate . substr($ENV{'_SEVERITY'},0,1); 

# subject will look like
#  (OK) Production nysupsvr02 cpu.percentutilisation
$subject="test";
#$subject = sprintf "(%2s) %s %s", $sev,
#    defined $ENV{'Environment'} ? $ENV{'Environment'} : '',
#    defined $ENV{'_SUBJECT'} ? $ENV{'_SUBJECT'} : "$ENV{'_HOSTNAME'} $ENV{'_VARIABLE'} ";
#---------------------------------------------

open (OUT, "> $outputFile" ) or die "Cannot open $outputFile: $!\n";

#---------------------------------------------
# Start writing out Email
# Moved all of the html to subroutines so that it is easier to read

# Standard HTML email header
&printHeader;

$infoMessage = "This message has been generated by ITRS..vavoom<br><br>";
print OUT $infoMessage;

# Start the html table
#&printStartTable('Details');
#&printRow('Gateway',$ENV{'_GATEWAY'});
#&printRow('Managed Entity',$ENV{'_MANAGED_ENTITY'});
#&printRow('Box',$ENV{'_HOSTNAME'});
#&printRow('Host',$ENV{'_NETPROBE_HOST'});

#&printSpanLine('&nbsp;');

# Set color based on severity
#my $color =
#    $ENV{'_SEVERITY'} =~ /CRITICAL/i ? '#EE6360' :
#    $ENV{'_SEVERITY'} =~ /WARNING/i ? '#EDC714' :
#    $ENV{'_SEVERITY'} =~ /OK/i ? '#72D251' :
#    'undef';

#&printRowColor ($color,'Severity',"$ENV{'_SEVERITY'}");

#&printSpanLine('&nbsp;');

#&printRow('Variable',$ENV{'_VARIABLE'});
#&printRow('Value',$ENV{'_VALUE'});
#&printRow('Comment',$ENV{'_COMMENT'});
#&printEndTable;
#_____________________________________________

#---------------------------------------------
# process the webslinger info
# create a single string from the returned html to quickly validate it

my $url = "http://192.168.142.20:8081/@@@/GENEOS/EMEA/LONDON/IBM/IBM/IBM%20JOBS%20EXPECTED.htm";




# Correct spaces into html space
$url =~ s/ /\%20/g;

my $wgetBinary = $^O =~ /solaris/i ? '/usr/sfw/bin/wget' : '/usr/bin/wget';
my @wget = `$wgetBinary -qO- $url`;
my $rc = sprintf "%s\n", join('',@wget);

print OUT "WebSlinger: $url\n";
# checks that the wget has data and that the data is valid
if ($#wget > -1 && $rc !~ /Error Failed to locate dataview path/) {

    # init this to zero so we dont reprint all the html
    my $print = 0;

    foreach (@wget) {
	# found the key just before the data we want to print
	if ($print == 0) {
	    $print = 1 if ($_ =~ /\/FORM/);
	}
	# found the key that marks we no longer want to print
	elsif ($print == 1 && $_ =~ /SCRIPT LANGUAGE/) {
	    print OUT "</TABLE>\n";
	    $print = 0;
	}
	# this is the data we want to print
	else {
	        # the following adjusts the background color to match more what is in webslinger
	        s/TABLE ALIGN=\"CENTER\"/TABLE ALIGN=\"CENTER\" BGCOLOR=\"#C4C4C4\"/;
		    print OUT $_;
	}
    }
}
else {
    print OUT "Malformed HTML\n";
}
# end webslinger addition
#_____________________________________________



#---------------------------------------------
# print out footer

print OUT $infoMessage;

close (OUT);

# Execute sendmail on this file
#`echo $outputFile`;
`/usr/lib/sendmail -i -t -O ErrorMode=q < $outputFile`;
print "\n\n Email has been sent to recipients\n\n";
print "Web Page can be viewed at http://http://192.168.142.20:8081/@@@/GENEOS/EMEA/LONDON/IBM/IBM/IBM%20JOBS%20EXPECTED.htm\n\n";


# Delete file
unlink $outputFile;

exit;
# end of main script
#_____________________________________________

# @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
# subroutines
# @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

#---------------------------------------------
# Format the header of the html e-mail
sub printHeader {
    print OUT "To: $email
From: $from
Subject: $subject
Date: $dateString
X-MS-Has-Attach:
X-MS-TNEF-Correlator:
MIME-Version: 1.0
X-Priority: 1 (Highest)
Content-Type: text/html; charset=us-ascii
Content-Transfer-Encoding: 7bit
Content-Disposition: inline; filename=CreateHTML.mail
<html>
<head>
<style type=\"text/css\">
table.mystyle
{
 border-width: 0 0 1px 1px;
 border-spacing: 0;
 border-collapse: collapse;
 border-style: solid;
}
.mystyle td, .mystyle th
{
  margin: 0;
  padding: 4px;
    border-width: 1px 1px 0 0;
    border-style: solid;
 font-family:Calibri,Arial,Verdana,Courier New
}
th.header
{
 background-color: #C0C0C0
}
tr.light td
{
 background-color: #FFFFFF 
}
tr.dark td
{
 background-color: #F4F4F4
}
</style>
</head>
<body style=\"font-family:Calibri;color:black\"><p ALIGN=LEFT>";
    return;
}

# Format the footer of the html e-mail
sub printFooter {
    print OUT '<br></p></body></html>';
    return;
}

# start an HTML table
sub printStartTable {
    my $tableName = shift;
    print OUT "<table class=\"mystyle\">\n";
    print OUT "<th class=\"header\" colspan=\"2\">$tableName</th>";
    $rowClass = 'light';
    return;
}

# end HTML table
sub printEndTable {
    print OUT "</table>\n";
    return;
}

# print a 2 column row, (name,value)
sub printRow {
    my $cellName  = shift;
    my $cellValue = shift;
    # Cant have an empty cell or it wont display properly
    $cellValue = "&nbsp;" if (!defined $cellValue);

    print OUT "<tr class=\"$rowClass\">\n";
    print OUT "  <td><b>$cellName</b></td>\n";
    print OUT "  <td>$cellValue</td>\n";
    print OUT "</tr>\n";
    $rowClass = $rowClass eq 'dark' ? 'light' : 'dark';
    return;
}

# print a 2 column row with the value in color (color,name,value)
sub printRowColor {
    my $color     = shift;
    my $cellName  = shift;
    my $cellValue = shift;
    # Cant have an empty cell or it wont display properly
    $cellValue = "&nbsp;" if (!defined $cellValue);

    print OUT "<tr class=\"$rowClass\">\n";
    print OUT "  <td><b>$cellName</b></td>\n";
    print OUT "  <td style=\"background-color:$color\">$cellValue</td>\n";
    print OUT "</tr>\n";
    $rowClass = $rowClass eq 'dark' ? 'light' : 'dark';
    return;
}

# Prints a blank line in a table that spans 2 columns
sub printSpanLine {
    my $text = shift;
    print OUT "<tr class=\"$rowClass\"><td colspan=\"2\">$text</td></tr>\n";
    $rowClass = $rowClass eq 'dark' ? 'light' : 'dark';
    return;
}

print "\n\n Email has been sent to recipients\n\n";
print "Web Page can be viewed at http://http://192.168.142.20:8081/@@@/GENEOS/EMEA/LONDON/IBM/IBM/IBM%20JOBS%20EXPECTED.htm\n\n";
