$(document).ready(function(){
	// Socket.io Initialization
	var socket = io.connect('http://localhost');

	// Login Menu
	$('.login').click(function(){
		$('.login-area').toggle();
	});

	/***********************************************************
		Admin: User Management
	***********************************************************/
	// Add User Flow
	$('#add_user_button').click(function(e){
		$name = $('#add_user #name');
		$email = $('#add_user #email');
		$admin = $('#add_user #admin');

		var errors = false;
		// Validate Form
		if(!$name.val()) {
			$name.closest('.control-group').addClass('error');
			$name.siblings('.help-block').text('Please enter the full name of the new user.');
			errors = true;
		} else {
			$name.closest('.control-group').removeClass('error');
		}
		var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if(!$email.val()) {
			$email.closest('.control-group').addClass('error');
			$email.siblings('.help-block').text('Please enter the user\'s email address.');
			errors = true;
		} else if(!regex.test($email.val())) {
			$email.closest('.control-group').addClass('error');
			$email.siblings('.help-block').text('Please enter a valid email address.');
			errors = true;
		} else {
			$email.closest('.control-group').removeClass('error');
		}

		if(!errors) {
			// Remove error classes
			$('#add_user .control-group').removeClass('error');
			// Show Confirmation Modal
			$('#add_user_modal').modal('show');

			$('#add_user_name').text($('#add_user #name').val());
			$('#add_user_email').text($('#add_user #email').val());
			if($('#add_user #admin').prop('checked')){
				$('#add_user_admin').text('Yes');
			} else {
				$('#add_user_admin').text('No');
			}
		} 
	});
	
	$('#add_user_confirm').click(function(){
		// Submit user information to database
		var checked = $('#add_user #admin').is(':checked');
		socket.emit('add_user', {
			name: $('#add_user #name').val(),
			email: $('#add_user #email').val(),
			admin: checked
		});
		socket.on('add_user_resp', function(resp){
			window.location.reload();
		});
	});

	// Remove User Flow
	$('button.remove-user-button').click(function(e){
		var name = $(this).parent().siblings('.user-name').text();
		$('#remove_user_modal #remove_user_name').text(name);
		$('#remove_user_modal #remove_user_confirm').attr('data-id', $(this).attr('data-id'));
		$('#remove_user_modal').modal('show');
	});
	$('#remove_user_confirm').click(function(){
		var id = $(this).attr('data-id');
		socket.emit('remove_user', id);
		socket.on('remove_user_resp', function(err){
			window.location = '/admin#user_management';
		});
	});

	// Edit User Flow
	$('.edit-user-button').click(function(){
		var $name = $(this).parent().siblings('.user-name');
		var $email = $(this).parent().siblings('.user-email');
		var $admin = $(this).parent().siblings('.user-admin').children('input');

		$name.html('<input id="user-name" type="text" value="' + $name.text() + '">');
		$email.html('<input id="user-email" type="text" value="' + $email.text() + '">');
		$admin.prop('disabled', false);

		$(this).closest('.user-actions').children('button:first').removeClass('edit-user-button').addClass('save-user-button btn-primary').text('Save');
		$(this).closest('.user-actions').children('button:last').removeClass('remove-user-button btn-danger').addClass('save-user-cancel').text('Cancel');
	});

	/***********************************************************
		Admin: Vouchers
	***********************************************************/
	$('#voucher_type').change(function(){
		var selected = $(this).val();

		if(selected == 'bp'){
			$('#voucher_amount').val('350');
		} else if(selected == 'dc_s') {
			$('#voucher_amount').val('450');
		} else if(selected == 'dc_l') {
			$('#voucher_amount').val('800');
		}
	});
	$('#issue_voucher_button').click(function(){
		// Validate Form
		var form = {
			type: $('#issue_voucher #voucher_type option:selected').text(),
			amount: $('#issue_voucher #voucher_amount').val(),
			name: $('#issue_voucher #voucher_name').val(),
			vessel: $('#issue_voucher #voucher_vessel').val(),
			permit: $('#issue_voucher #voucher_permit').val(),
			email: $('#issue_voucher #voucher_email').val(),
			phone: $('#issue_voucher #voucher_phone').val()
		};
		// Show Confirmation
		$('#issue_voucher_modal #issue_voucher_type').text(form.type);
		$('#issue_voucher_modal #issue_voucher_amount').text(form.amount);
		$('#issue_voucher_modal #issue_voucher_name').text(form.name);
		$('#issue_voucher_modal #issue_voucher_vessel').text(form.vessel);
		$('#issue_voucher_modal #issue_voucher_permit').text(form.permit);
		$('#issue_voucher_modal #issue_voucher_email').text(form.email);
		$('#issue_voucher_modal #issue_voucher_phone').text(form.phone);
		$('#issue_voucher_modal').modal('show');
	});
	$('#issue_voucher_confirm').click(function(){
		var form = {
			type: $('#issue_voucher #voucher_type').val(),
			amount: $('#issue_voucher #voucher_amount').val(),
			name: $('#issue_voucher #voucher_name').val(),
			vessel: $('#issue_voucher #voucher_vessel').val(),
			permit: $('#issue_voucher #voucher_permit').val(),
			email: $('#issue_voucher #voucher_email').val(),
			phone: $('#issue_voucher #voucher_phone').val()
		};

		socket.emit('issue_voucher', form);
		socket.on('issue_voucher_resp', function(err){
			if(err) console.log(err);
			window.location.reload();
		});
	});

	/***********************************************************
		Application Process
	***********************************************************/
	$('#application_form').submit(function(){
		var empty = false;
		var form = {};
		$('#application_form :input:not([type=submit])').each(function(){
			form[$(this).attr('id')] = $(this).val();

			if(!$(this).val()) {
				$(this).closest('.control-group').addClass('error');
				empty = true;
			}
		});
		
		if(!empty) {
			socket.emit('application', form);
			socket.on('application_resp', function(){
				alert('application submitted');
			});
		}
		return false;
	});
	/***********************************************************
		TESTING ONLY
	***********************************************************/
	$('.register').click(function(){
		$('.register-area').toggle();
	});

});