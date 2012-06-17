// Socket.io Initialization
var socket = io.connect('http://localhost');

// Nivo Slider
$(window).load(function(){
	$('#slider').nivoSlider({
		controlNav: false,
		controlNavThumbs: true
	});
});

$(document).ready(function(){
	// Initialize dropdowns
	$('.dropdown-toggle').dropdown();
	// Initialize TinyMCE
	$('textarea.tinymce').tinymce({
    // Location of TinyMCE script
    script_url : '/js/tiny_mce/tiny_mce.js',

    // General options
    theme : "advanced",
    plugins: 'advimage, advlink, media, paste,fullscreen',
    //plugins : "pagebreak,style,layer,table,save,advhr,advimage,advlink,emotions,iespell,inlinepopups,insertdatetime,preview,media,searchreplace,print,contextmenu,paste,directionality,fullscreen,noneditable,visualchars,nonbreaking,xhtmlxtras,template",

    content_css: '/css/bootstrap.css',
    // Theme options
    theme_advanced_buttons1 : "bold,italic,underline,strikethrough,|,bullist,numlist,|,justifyleft,justifycenter,justifyright,justifyfull,|,outdent,indent,|,formatselect,fontsizeselect,|,link,unlink,image,media,|,pastetext,pasteword,cleanup,code,|,fullscreen",
    theme_advanced_toolbar_location : "top",
    theme_advanced_toolbar_align : "left",
    theme_advanced_statusbar_location : "bottom",
    theme_advanced_resizing : false,
  });
	
	/***********************************************************
		Image Gallery
	***********************************************************/
	$('#gallery').imagegallery({
		 // selector given to jQuery's delegate method:
    selector: 'a[rel="gallery"]',
    // event handler namespace:
    namespace: 'imagegallery',
    // Shows the next image after the given time in ms (0 = disabled):
    slideshow: 0,
    // Offset of image width to viewport width:
    offsetWidth: 100,
    // Offset of image height to viewport height:
    offsetHeight: 100,
    // Display images fullscreen (overrides offsets):
    fullscreen: false,
    // Display images as canvas elements:
    canvas: false,
    // body class added on dialog display:
    bodyClass: 'gallery-body',
    // element id of the loading animation:
    loaderId: 'gallery-loader',
    // list of available dialog effects,
    // used when show/hide is set to "random":
    effects: [
        'blind',
        'clip',
        'drop',
        'explode',
        'fade',
        'fold',
        'puff',
        'slide',
        'scale'
    ],
    // The following are jQuery UI dialog options, see
    // http://jqueryui.com/demos/dialog/#options
    // for additional options and documentation:
    modal: true,
    resizable: false,
    width: 'auto',
    height: 'auto',
    show: 'fade',
    hide: 'fade',
    dialogClass: 'gallery-dialog'
	});
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
	// Mailing Address
	$('#mailing').change(function(){
		if(!this.checked){
			$('#mailing_address').show();
		} else {
			$('#mailing_address').hide();
		}
	});

	// Research questions
	$('#research').change(function(){
		if(this.checked){
			$('#research_info').show();
		} else {
			$('#research_info').hide();
		}
	});
	$('#application_form').submit(function(){
		var validate = true;

		$('#name,#permit,#vessel_name,#vessel_port,#vessel_length, #vessel_hp,#contact_email,#contact_phone_home,#contact_res_address1,#contact_res_city, #contact_res_zip').each(function(){
			if(!$(this).val()){
				validate = false;
				$(this).closest('.control-group').addClass('error');
				$(this).focus(function(){
					$(this).closest('.control-group').removeClass('error');
					$('.message').remove();
				});
			}
		});

		if(!$('#mailing').prop('checked')){
			$('#contact_mailing_address1, #contact_mailing_city, #contact_mailing_zip').each(function(){
				if(!$(this).val()){
					validate = false;
					$(this).closest('.control-group').addClass('error');
					$(this).focus(function(){
						$(this).closest('.control-group').removeClass('error');
						$('.message').remove();
					});
				}
			});
		}

		if(!$('#drop_chain').prop('checked') && !$('#belly_panel').prop('checked')){
			$('#drop_chain').closest('.control-group').addClass('error');
			validate = false;
			$('#drop_chain, #belly_panel').change(function(){
				$(this).closest('.control-group').removeClass('error');
				$('.message').remove();
			});
		}

		if($('#research').prop('checked')){
			if(!$('#research_crew').val()){
				validate = false;
				$('#research_crew').closest('.control-group').addClass('error');
				$('#research_crew').focus(function(){
					$(this).closest('.control-group').removeClass('error');
					$('.message').remove();
				});
			}
		}

		if(!$('#verify').prop('checked')){
			validate = false;
			$('#verify').closest('.checkbox').css('color', '#9d261d');
			$('#verify').change(function(){
				$(this).closest('.checkbox').css('color', 'inherit');
				$('.message').remove();
			});
		}

		if(validate){
			var form = {
				applicant: {
					name: $('#name').val(),
					company: $('#company_name').val(),
					license: $('#permit').val()
				},
				vessel: {
					name: $('#vessel_name').val(),
					port: $('#vessel_port').val(),
					length: $('#vessel_length').val(),
					hp: $('#vessel_hp').val()
				},
				contact: {
					email: $('#contact_email').val(),
					phone_home: $('#contact_phone_home').val(),
					phone_cell: $('#contact_phone_cell').val(),
					res_address: {
						line1: $('#contact_res_address1').val(),
						line2: $('#contact_res_address2').val(),
						city: $('#contact_res_city').val(),
						state: $('#contact_res_state').val(),
						zip: $('#contact_res_zip').val()
					},
					mailing_address: mailingAddress()
				},
				voucher: {
					drop_chain: applyDropChain(),
					belly_panel: applyBellyPanel(),
				},
				research: research()
			};
			socket.emit('applicationSubmit', form);
			socket.on('application_resp', function(resp){
				if(resp.error){
					$('#apply_modal .error').show()
					$('#apply_modal .success').hide();
					$('#apply_modal').modal('show');
				} else {
					$('#apply_modal .success').show()
					$('#apply_modal .error').hide();
					$('#apply_modal').modal('show');

					$('#apply_modal .modal-footer a').click(function(){
						window.location = '/';
					});
				}
			});

		} else {
			$('body').append('<div class="alert alert-error message"><a class="close" data-dismiss="alert" href="#">&times;</a><h4>Application Incomplete</h4><p>There are incomplete fields in your application. Please attend to the fields highlighted in red.</p></div>');
		}
		
		return false;
	});
	
	function mailingAddress(){
		if(!$('#mailing').prop('checked')){
			return {
				line1: $('#contact_mailing_address1').val(),
				line2: $('#contact_mailing_address2').val(),
				city: $('#contact_mailing_city').val(),
				state: $('#contact_mailing_state').val(),
				zip: $('#contact_mailing_zip').val()
			};
		} else {
			return {};
		}
	}
	function applyDropChain(){
		if($('#drop_chain').prop('checked')){
			return true;
		} else {
			return false;
		}
	}
	function applyBellyPanel(){
		if($('#belly_panel').prop('checked')){
			return true;
		} else {
			return false;
		}
	}
	function research(){
		if($('#research').prop('checked')){
			return {
				num_crew: $('#research_crew').val(),
				partners: $('#companions').val()
			};
		} else {
			return {};
		}
	}

	/***********************************************************
		Survey
	***********************************************************/
	$('#survey_form').submit(function(){
		var validate = true;

		$('#name, #vessel, #stat_areas').each(function(){
			if(!$(this).val()){
				validate = false;
				$(this).closest('.control-group').addClass('error');
				$(this).focus(function(){
					$(this).closest('.control-group').removeClass('error');
					$('.message').remove();
				});
			}
		});

		if(!$('#drop_chain_large').prop('checked') && !$('#drop_chain_small').prop('checked') && !$('#belly_panel').prop('checked')){
			validate = false;
			$('#drop_chain_large').closest('.control-group').addClass('error');
			$('#drop_chain_small, #drop_chain_large, #belly_panel').change(function(){
				$(this).closest('.control-group').removeClass('error');
				$('.message').remove();
			});
		}

		if(!$('#squid').prop('checked') && !$('#whiting').prop('checked') && !$('#scup').prop('checked') && !$('#other').prop('checked')){
			validate = false;
			$('#squid').closest('.control-group').addClass('error');
			$('#squid, #whiting, #scup, #other').change(function(){
				$(this).closest('.control-group').removeClass('error');
				$('.message').remove();
			});
			$('#other_detail').focus(function(){
				$(this).closest('.control-group').removeClass('error');
				$('.message').remove();
			});
		}

		if($('#other').prop('checked') && !$('#other_detail').val()){
			validate = false;
			$('.other').css('color', '#9d261d');
			$('#other_detail').focus(function(){
				$('.other').css('color', 'inherit');
				$('.message').remove();
			});
		}

		if(!$('input:radio[name=effective]:checked').length){
			validate = false;
			$('input:radio[name=effective]').closest('.control-group').addClass('error');
			$('input:radio[name=effective]').change(function(){
				$(this).closest('.control-group').removeClass('error');
				$('.message').remove();
			});
		}

		if(validate){
			var form = {
				name: $('#name').val(),
				vessel: $('#vessel').val(),
				gear_type: {
					drop_chain_small: $('#drop_chain_small').prop('checked'),
					drop_chain_large: $('#drop_chain_large').prop('checked'),
					belly_panel: $('#belly_panel').prop('checked')
				},
				targeted_fishery: {
					squid: $('#squid').prop('checked'),
					whiting: $('#whiting').prop('checked'),
					scup: $('#scup').prop('checked'),
					other: $('#other').prop('checked'),
					other_details: $('#other_detail').val()
				},
				statistical_area: $('#stat_areas').val(),
				effective: $('#yes').prop('checked'),
				observations: $('#observations').val()
			};

			socket.emit('surveySubmit', form);
			socket.on('survey_resp', function(resp){
				if(resp.error){
					$('#survey_modal .error').show()
					$('#survey_modal .success').hide();
					$('#survey_modal').modal('show');
				} else {
					$('#survey_modal .success').show()
					$('#survey_modal .error').hide();
					$('#survey_modal').modal('show');

					$('#survey_modal .modal-footer a').click(function(){
						window.location = '/';
					});
				}
			});
		} else {
			$('body').append('<div class="alert alert-error message"><a class="close" data-dismiss="alert" href="#">&times;</a><h4>Survey Incomplete</h4><p>There are incomplete fields in your survey. Please attend to the fields highlighted in red.</p></div>');
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

/***********************************************************
	Login
***********************************************************/
$('#login_button').click(function(){
	$('#login_area').toggle();
});

/***********************************************************
	Sidebar
***********************************************************/
$('.sidebar .regular > li').hover(function(){
	$(this).children('ul').slideDown();
}, function(){
	$(this).children('ul').hide();
});

/***********************************************************
	Admin  - Pages
***********************************************************/
$('.save-content').click(function(){
	var content = {};
	$('textarea.tinymce').each(function(){
		content[$(this).attr('id')] = $(this).html();
	});
	
	socket.emit('saveContent', $('#page').val(), content);
	socket.on('saveContentResp', function(resp){
		$('body').append('<div class="alert alert-success message"><a class="close" data-dismiss="alert" href="#">&times;</a><h4>Changes Saved</h4></div>');
	});
});

/*************************************************************
  Admin: View Applications
*************************************************************/
$('.view-application').click(function(){
	socket.emit('getApplication', $(this).attr('data-id'));
	socket.on('getApplicationResp', function(app){
		console.log(app);
		// Applicant
		$('#view_application_modal #applicant_name').text(app.applicant.name);
		$('#view_application_modal #applicant_company').text(app.applicant.company);
		$('#view_application_modal #applicant_permit').text(app.applicant.license);
		// Vessel
		$('#view_application_modal #vessel_name').text(app.vessel.name);
		$('#view_application_modal #vessel_port').text(app.vessel.port);
		$('#view_application_modal #vessel_length').text(app.vessel.length + 'ft');
		$('#view_application_modal #vessel_hp').text(app.vessel.hp + 'HP');
		// Contact
		$('#view_application_modal #contact_email').text(app.contact.email);
		$('#view_application_modal #contact_home_phone').text(app.contact.phone_home);
		$('#view_application_modal #contact_cell_phone').text(app.contact.phone_cell);
		$('#view_application_modal #res_address1').text(app.contact.res_address.line1);
		$('#view_application_modal #res_address2').text(app.contact.res_address.line2);
		$('#view_application_modal #res_city').text(app.contact.res_address.city + ', ');
		$('#view_application_modal #res_state').text(app.contact.res_address.state + ' ');
		$('#view_application_modal #res_zip').text(app.contact.res_address.zip);
		if(app.contact.mail_address){
			$('#view_application_modal #mail_address1').text(app.contact.mail_address.line1);
			$('#view_application_modal #mail_address2').text(app.contact.mail_address.line2);
			$('#view_application_modal #mail_city').text(app.contact.mail_address.city + ', ');
			$('#view_application_modal #mail_state').text(app.contact.mail_address.state + ' ');
			$('#view_application_modal #mail_zip').text(app.contact.mail_address.zip);
			$('.mailing').show();
		} else {
			$('.mailing').hide();
		}
		// Vouchers
		$('#view_application_modal #drop_chain').attr('checked', app.voucher.drop_chain);
		$('#view_application_modal #belly_panel').attr('checked', app.voucher.belly_panel);
		// Research
		if(app.research){
			$('#view_application_modal #research').text('Yes');
			$('#view_application_modal #num_crew').text(app.research.num_crew);
			$('#view_application_modal #partners').text(app.research.partners);
			$('#view_application_modal .research').show();
		} else {
			$('#view_application_modal #research').text('No');
			$('#view_application_modal .research').hide();
		}
		
		if(app.status == 'open'){
			$('#view_application_modal .modal-footer button').attr('data-id', app._id).show();
		}
		$('#view_application_modal').modal('show');
	});
});

$('#view_application_modal #accept').click(function(){
	socket.emit('acceptApplication', $(this).attr('data-id'));
	socket.on('acceptApplicationResp', function(resp){
		window.location = '/admin/actions/applications';
	});
});

$('#view_application_modal #decline').click(function(){
	socket.emit('declineApplication', $(this).attr('data-id'));
	socket.on('declineApplicationResp', function(resp){
		window.location = '/admin/actions/applications';
	});
});
