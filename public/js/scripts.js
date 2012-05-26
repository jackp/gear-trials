$(document).ready(function(){
	// Socket.io Initialization
	var socket = io.connect('http://localhost');

	// Login Menu
	$('.login').click(function(){
		$('.login-area').toggle();
	});
	$('.dropdown-toggle').dropdown()
	/***********************************************************
		Admin: General
	***********************************************************/
	$('#admin-area table').tablesorter();

	/***********************************************************
		Admin: User Management
	***********************************************************/
	
	// Add User Flow
	$('#add_user_button').click(function(e){
		$name = $('#add_user #name');
		$email = $('#add_user #email');

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
			$('#add_user_location').text($('#add_user #location').val());
		} 
	});
	
	$('#add_user_confirm').click(function(){
		// Submit user information to database
		socket.emit('add_user', {
			name: $('#add_user #name').val(),
			email: $('#add_user #email').val(),
			location: $('#add_user #location').val(),
			admin: $('#add_user #location').val() === 'CFRF'
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
			window.location.reload();
		});
	});

	// Edit User Flow
	$('.edit-user-button').click(function(){
		var $name = $(this).parent().siblings('.user-name');
		var $email = $(this).parent().siblings('.user-email');

		$name.html('<input id="user-name" type="text" value="' + $name.text() + '">');
		$email.html('<input id="user-email" type="text" value="' + $email.text() + '">');

		$(this).closest('.user-actions').children('button:first').removeClass('edit-user-button').addClass('save-user-button btn-primary').text('Save');
		$(this).closest('.user-actions').children('button:last').removeClass('remove-user-button btn-danger').addClass('save-user-cancel').text('Cancel');
	});

	/***********************************************************
		Admin: Vouchers
	***********************************************************/
	$('#voucher_type').change(function(){
		var selected = $(this).val();

		if(selected == 'Belly Panel'){
			$('#voucher_amount').val('350');
		} else if(selected == 'Drop Chain (Small)') {
			$('#voucher_amount').val('450');
		} else if(selected == 'Drop Chain (Large)') {
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
			// Show Confirmation Modal
			$('#apply_type').text(form.voucher_type);
			$('#apply_name').text(form.name);
			$('#apply_email').text(form.email);
			$('#apply_phone').text(form.phone);
			$('#apply_vessel').text(form.vessel);
			$('#apply_permit').text(form.permit);
			$('#apply_modal').modal('show');

			$('#apply_confirm').click(function(){
				socket.emit('application', form);
					socket.on('application_resp', function(){
						window.location = '/';
					});
			});
		}
		return false;
	});

	

	$('button.accept-application').click(function(){
		$this = $(this);
		$('#accept_application_name').text($this.parent().siblings('.application-name').text());
		$('#accept_application_voucher_type').text($this.parent().siblings('.application-voucher-type').text());
		$('#accept_application_vessel').text($this.parent().siblings('.application-vessel').text());
		$('#accept_application_permit').text($this.parent().siblings('.application-permit').text());
		$('#accept_application_contact').html($this.parent().siblings('.application-contact').html());
		$('#accept_application_date_submitted').text($this.parent().siblings('.application-date-submitted').text());
		$('#accept_application_confirm').attr('data-id', $this.attr('data-id'));
		$('#accept_application_modal').modal('show');
	});

	$('#accept_application_confirm').click(function(){
		socket.emit('accept_application', $(this).attr('data-id'));
		socket.on('accept_application_resp', function(){
			window.location.reload();
		});
	});

	$('button.decline-application').click(function(){
		$this = $(this);
		$('#decline_application_name').text($this.parent().siblings('.application-name').text());
		$('#decline_application_voucher_type').text($this.parent().siblings('.application-voucher-type').text());
		$('#decline_application_vessel').text($this.parent().siblings('.application-vessel').text());
		$('#decline_application_permit').text($this.parent().siblings('.application-permit').text());
		$('#decline_application_contact').html($this.parent().siblings('.application-contact').html());
		$('#decline_application_date_submitted').text($this.parent().siblings('.application-date-submitted').text());
		$('#decline_application_confirm').attr('data-id', $this.attr('data-id'));
		$('#decline_application_modal').modal('show');
	});

	$('#decline_application_confirm').click(function(){
		socket.emit('decline_application', $(this).attr('data-id'));
		socket.on('decline_application_resp', function(){
			window.location.reload();
		});
	});

	/***********************************************************
		Dealer: Process Voucher
	***********************************************************/
	$('#voucher_lookup').submit(function(){
		$input = $(this).children('input[type=text]');
		if($input.val().length === 16){
			socket.emit("voucher_lookup", $input.val());
			socket.on('voucher_lookup_resp', function(resp){
				if(resp){
					if((resp.status === 'open') && (new Date(resp.expiration_date) >= new Date())) {
						$('#lookup_results').html(
							'<div class="alert alert-success">\
								<a class="close" data-dismiss="alert" href="#">×</a>\
								<h4 class="alert-heading">Voucher Found!</h4>\
								<dl class="dl-horizontal">\
									<dt>Voucher Holder:</dt>\
									<dd><i>Name: </i>' + resp.name + '<br><i>Vessel: </i>' + resp.vessel + '</dd>\
									<dt>Contact Info:</dt>\
									<dd>' +  resp.email + '<br>' + resp.phone + '</dd>\
									<dt>Voucher Type:</dt>\
									<dd>' + resp.type + '</dd>\
									<dt>Amount:</dt>\
									<dd>$' + resp.amount + '</dd>\
									<dt>Issued Date:</dt>\
									<dd>' + new Date(resp.issued_date).toDateString() + '</dd>\
									<dt>Expiration Date:</dt>\
									<dd>' + new Date(resp.expiration_date).toDateString() + '</dd>\
								</dl>\
								<button class="btn btn-primary btn-large process-voucher" data-id="' + resp.number + '" data-name="' + resp.name + '" data-type="' + resp.type + '" data-amount="' + resp.amount + '">Use Voucher</button>\
							</div>');
						$('button.process-voucher').click(function(){
							$this = $(this);
							$('#process_voucher_modal #voucher_number').text($this.attr('data-id'));
							$('#process_voucher_modal #voucher_name').text($this.attr('data-name'));
							$('#process_voucher_modal #voucher_type').text($this.attr('data-type'));
							$('#process_voucher_modal #voucher_amount').text('$' + $this.attr('data-amount'));
							$('#process_voucher_modal #process_voucher_confirm').attr('data-id', $this.attr('data-id'));
							$('#process_voucher_modal').modal('show');
						});

						$('#process_voucher_confirm').click(function(){
							socket.emit('process_voucher', $(this).attr('data-id'), $('#user_location').val());
							socket.on('process_voucher_resp', function(){
								window.location = '/vouchers';
							});
						});
					} else if(resp.status === 'used') {
						$('#lookup_results').html(
							'<div class="alert alert-error">\
								<a class="close" data-dismiss="alert" href="#">×</a>\
								<h4 class="alert-heading">Voucher Already Used.</h4>\
								<dl class="dl-horizontal">\
									<dt>Voucher Holder:</dt>\
									<dd><i>Name: </i>' + resp.name + '<br><i>Vessel: </i>' + resp.vessel + '</dd>\
									<dt>Contact Info:</dt>\
									<dd>' +  resp.email + '<br>' + resp.phone + '</dd>\
									<dt>Voucher Type:</dt>\
									<dd>' + resp.type + '</dd>\
									<dt>Amount:</dt>\
									<dd>$' + resp.amount + '</dd>\
									<dt>Issued Date:</dt>\
									<dd>' + new Date(resp.issued_date).toDateString() + '</dd>\
									<dt>Date Used:</dt>\
									<dd><b>' + new Date(resp.used_date).toDateString() + '</b></dd>\
									<dt>Location Used:</dt>\
									<dd><b>' + resp.used_location + '</b></dd>\
								</dl>\
							</div>');
					} else {
						$('#lookup_results').html(
							'<div class="alert alert-error">\
								<a class="close" data-dismiss="alert" href="#">×</a>\
								<h4 class="alert-heading">Voucher Expired.</h4>\
								<dl class="dl-horizontal">\
									<dt>Voucher Holder:</dt>\
									<dd><i>Name: </i>' + resp.name + '<br><i>Vessel: </i>' + resp.vessel + '</dd>\
									<dt>Contact Info:</dt>\
									<dd>' +  resp.email + '<br>' + resp.phone + '</dd>\
									<dt>Voucher Type:</dt>\
									<dd>' + resp.type + '</dd>\
									<dt>Amount:</dt>\
									<dd>$' + resp.amount + '</dd>\
									<dt>Issued Date:</dt>\
									<dd>' + new Date(resp.issued_date).toDateString() + '</dd>\
									<dt>Expiration Date:</dt>\
									<dd><b>' + new Date(resp.expiration_date).toDateString() + '</b></dd>\
								</dl>\
							</div>');
					}
				} else {
					$('#lookup_results').html(
						'<div class="alert alert-error">\
							<a class="close" data-dismiss="alert" href="#">×</a>\
							<h4 class="alert-heading">Voucher not found.</h4>\
						</div>');
				}
			});
		} else {
			$('#lookup_results').html(
				'<div class="alert alert-block">\
					<a class="close" data-dismiss="alert" href="#">×</a>\
					<h4 class="alert-heading">Voucher must be 16 digits long.</h4>\
				</div>');
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