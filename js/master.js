var db = new air.SQLConnection();
var textFileDir = "VoucherEntry/text files/";  // on desktop
var htmlFileDir = "VoucherEntry/report files/" // on desktop
function setupDB() {
	var dbFile = air.File.applicationStorageDirectory.resolvePath("db/voucherentry_live.db");
	//In production, uncomment the if block to maintain the database.
	//if (!dbFile.exists) {
		var dbTemplate = air.File.applicationDirectory.resolvePath("db/voucherentry.db");
		dbTemplate.copyTo(dbFile, true);	
	//}
	try {
		db.open(dbFile);
	}
	catch (error) {
		air.trace("DB error:", error.message);
		air.trace("Details:", error.details);
	}
}

function getDefaults() {  
 dbQuery = new air.SQLStatement();  
 dbQuery.sqlConnection = db;  
 dbQuery.text = "SELECT district_name, district_initials, fund, department FROM defaults WHERE id=1";  
   
 try {  
   dbQuery.execute();  
 } catch (error) {  
   air.trace("Error retrieving data from DB:", error);  
   air.trace(error.message);  
   return;  
 }  
   
 return dbQuery.getResult();  
}

function saveDefaults() {
	district_name = escape( $('#district_name').val() );
	district_initials = escape( $('#district_initials').val() );
	default_fund = escape( $('#default_fund').val() );
	default_dept = escape( $('#default_dept').val() );

	dbQuery = new air.SQLStatement();  
	dbQuery.sqlConnection = db;  
	dbQuery.text  = "UPDATE defaults SET district_name='"+district_name+"', district_initials='"+district_initials+"', fund='"+default_fund+"', department='"+default_dept+"' WHERE id=1";

	try {  
		dbQuery.execute();  
	} catch (error) {  
		air.trace("Error inserting new record into database:", error);  
		air.trace(error.message);  
	}  
}

function getInitials() {
	defaults = getDefaults();
	return unescape(defaults.data[0].district_initials);
}

function exportHtmlFile() {
//	navigateToURL(new URLRequest(File.applicationStorageDirectory.nativePath + "/courses/" + fileName));
}

function exportTextFile() {
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; // January is 0!
	var yyyy = today.getFullYear();
   var initials = getInitials();
	var filename = initials+yyyy+mm+dd+".txt";

 	// Create a reference to the target directory
	var dir = air.File.desktopDirectory.resolvePath( textFileDir );
	// Check to see if the directory exists.. if not, then create it
 	if ( !dir.exists ) {
		dir.createDirectory();
		air.trace( "Directory created." );
 	}
 	else {
    	air.trace( "Directory already exists." );
 	}
	var file = air.File.desktopDirectory.resolvePath( textFileDir+filename );
	if( !file.exists ) {
		air.trace("File created.");
	}
	else {
		air.trace( "File already exists - truncating it before writing to it." );
	}
	// Create a stream and open the file for writing
	var stream = new air.FileStream();
	var contents = getExportText();
	stream.open( file, air.FileMode.WRITE );
	stream.writeUTFBytes( "" );  // truncate file if it exists
	stream.writeUTFBytes( contents );
	stream.close();
}

function getExportText() {
	var output = "";
	var set_num = 1;
	var set_data = [];
	var num_sets = getNumVouchersets();

	for( i=set_num; i<= num_sets; i++ ) {
		if( $.trim($('#vendor_'+i).val()).length > 0 ) {
			// if the voucher is filled in, get the data
			set_data = getVouchersetData(i);
			// compile output
			output += ""
				+ rPad( set_data['voucher'], set_data['voucher_length'] )
				+ rPad( set_data['vendor'], set_data['vendor_length'] )
				+ rPad( set_data['amount'], set_data['amount_length'] )
				+ rPad( set_data['date'], set_data['date_length'] )
				+ rPad( set_data['invoice'], set_data['invoice_length'] )
				+ rPad( set_data['fund'], set_data['fund_length'] )
				+ rPad( set_data['department'], set_data['department_length'] )
				+ rPad( set_data['mystery'], set_data['mystery_length'] )
				+ rPad( set_data['description'], set_data['description_length'] )
				+ "\n";
		}
	}
	
	if( output.length < 10 ) {
		air.trace ("No voucher data to export.");
		return "No voucher data to export.";
	}
	else {
		air.trace( output );
		return output.toUpperCase();
	}
}

function formatDate_YYYYMMDD(date_str) {
	// assumes that date_str is currently DD/MM/YYYY
	parts = date_str.split("/");
	mm = parts[0];
	dd = parts[1];
	yyyy = parts[2];
	if( mm.length != 2 ) { mm = "0"+mm; }
   if( dd.length != 2 ) { dd = "0"+dd; }
	return yyyy+mm+dd;
}

function getVouchersetData(setid) {
	//air.trace( $('#voucherset_'+setid+' input:visible').length );
	var set = [];
	set['voucher']     = $.trim( $('#voucher_'+setid).val() );
	set['voucher_length'] = $('#voucher_'+setid).attr('maxlength');
	set['vendor']      = $.trim( $('#vendor_'+setid).val() );
	set['vendor_length'] = $('#vendor_'+setid).attr('maxlength');
	set['date']        = formatDate_YYYYMMDD( $.trim( $('#date_'+setid).val() ) );
	set['date_length'] = $('#date_'+setid).attr('maxlength');
	set['amount']      = $.trim( $('#amount_'+setid).val() );
	set['amount_length'] = $('#amount_'+setid).attr('maxlength');
	set['invoice']     = $.trim( $('#invoice_'+setid).val() );
	set['invoice_length'] = $('#invoice_'+setid).attr('maxlength');
	set['description'] = $.trim( $('#description_'+setid).val() );
	set['description_length'] = $('#description_'+setid).attr('maxlength');
	set['fund']        = $.trim( $('#fund_'+setid).val() );
	set['fund_length'] = $('#fund_'+setid).attr('maxlength');
	set['department']  = $.trim( $('#department_'+setid).val() );
	set['department_length'] = $('#department_'+setid).attr('maxlength');
	set['mystery']		 		= "3700";
	set['mystery_length']	= 6;
	return set;
}

function getVoucherset(setid) {
	return ''
	+ '<fieldset class="voucherset" id="voucherset_'+setid+'" style="display: none;">'
	+ '	<div class="field"><label for="voucher_'+setid+'">Voucher ID</label><br /><input type="text" id="voucher_'+setid+'" name="voucher_'+setid+'" value="2091" class="voucherid" maxlength="8" style="width: 75px;" /></div>'
	+ '	<div class="field"><label for="vendor_'+setid+'">Vendor ID</label><br /><input type="text" id="vendor_'+setid+'" name="vendor_'+setid+'" value="MODEIRDI01" class="vendorid" maxlength="10" style="width: 90px;" /></div>'
	+ '	<div class="field"><label for="date_'+setid+'">Date</label><br /><input type="text" id="date_'+setid+'" name="date_'+setid+'" value="11/16/2009" class="datepicker" maxlength="10" style="width: 80px;" /></div>'
	+ '	<div class="field"><label for="amount_'+setid+'">Amount</label><br /><input type="text" id="amount_'+setid+'" name="amount_'+setid+'" value="8863.32" class="currency" maxlength="17" style="width: 80px;" /></div>'
	+ '	<div class="field"><label for="invoice_'+setid+'">Invoice Number</label><br /><input type="text" id="invoice_'+setid+'" name="invoice_'+setid+'" value="" maxlength="28" style="width: 250px;" /></div>'
	+ '	<div class="field"><label for="description_'+setid+'">Description</label><input type="text" id="description_'+setid+'" name="description_'+setid+'" value="PAYROLL / 11-15-09" maxlength="30" style="width: 250px;" /></div>'
	+ '	<div class="field"><label for="fund_'+setid+'">Fund</label><input type="text" id="fund_'+setid+'" name="fund_'+setid+'" value="I30" maxlength="5" style="width: 90px;" /></div>'
	+ '	<div class="field"><label for="department_'+setid+'">Dept</label><input type="text" id="department_'+setid+'" name="department_'+setid+'" value="18I" maxlength="7" style="width: 90px;" /></div>'
	+ '</fieldset>'+"\n";
}

function hideAllBut(element_id) {
	$('.page').hide().each( function () {
		if (this.id == element_id) {
			$('#'+element_id).fadeIn(500);
		}
	});
}

function getNumVouchersets() {
	return $('.voucherset').size(); 
}
function getNumEmptyVouchersets() {
	total = getNumVouchersets();
	num_voucherid = 0;
	$('.vendorid').each( function() {
		if( $.trim($(this).val()).length < 1 ) {
			num_voucherid++;
		}
	});
	return num_voucherid;
}

function appendVoucherset() {
	$('#voucher_fieldsets').append(getVoucherset(getNumVouchersets()+1));
	$('.voucherset:last').fadeIn(500);
	resetVouchersetBindings();
}

function resetVouchersetBindings() {
	$('input.currency').unbind('.format').bind("keyup.format keydown.format keypress.format", function(event) {
		//console.log(event.keyCode);
		// if the letter is not a digit, then don't type anything
		if( (event.which!=8 && event.which!=9 && event.which!=0) && (event.which<48 || event.which>57) && (event.which<96 || event.which>105) ) {
			return false;
		}
		amount = $(this).val().replace(/\./i, "");
		dollars = amount.substr(0,amount.length-2);
		cents = amount.substr(amount.length-2)
		$(this).val(dollars+"."+cents);
	});
	
   $(".datepicker").mask("99/99/9999");

	$('.voucherset input').unbind('.appendnew').bind('change.appendnew focus.appendnew blur.appendnew', function(event){
		//console.log($(event.target).parent().parent().find('.vendorid').val());
		if( 
			$(event.target).parent().parent().find('.voucherid').val() != "" &&
			$(event.target).parent().parent().find('.vendorid').val() != "" &&
			$(event.target).parent().parent().find('.currency').val().length > 1 &&
			getNumEmptyVouchersets() == 0
		) {
			appendVoucherset();
		}
	});
}

function applicationExit() {
	// save to text-file first?
	// should I alert them if they haven't printed the report?
   air.NativeApplication.nativeApplication.exit();    
	return false;
}

function bindButtons() {
	$('.nav #home_voucher_entry').bind("click", function() { 
		hideAllBut("entry"); 
		if (getNumVouchersets() == 0) {
			appendVoucherset();
		}
	});
	$('.nav #home_edit_defaults').bind("click", function() { 
		defaults = getDefaults();
		$('#district_name').val(unescape(defaults.data[0].district_name));
		$('#district_initials').val(unescape(defaults.data[0].district_initials));
		$('#default_fund').val(unescape(defaults.data[0].fund));
		$('#default_dept').val(unescape(defaults.data[0].department));
		hideAllBut("setup"); 
	});
	$('.nav #home_about').bind("click", function() { hideAllBut("about"); });
	$('.nav #home_exit').bind("click", function() { applicationExit(); });
	$('.nav #setup_close').bind("click", function() { saveDefaults(); hideAllBut("home"); });
	$('.nav #entry_close').bind("click", function() { hideAllBut("home"); });
	$('.nav #about_close').bind("click", function() { hideAllBut("home"); });
	$('.nav #entry_export').bind("click", function() { exportTextFile(); });
	$('.nav #entry_print').bind("click", function() { getVouchersetData(1); });
	
}
function rPad(start_string, length_required) {
	start_string = start_string.toString()
	while( start_string.length < length_required ) {
		start_string += " ";
	}
	return start_string;
}

