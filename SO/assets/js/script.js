"use strict";

/*
if ('serviceWorker' in navigator) {
  	window.addEventListener('load', function() {
	    navigator.serviceWorker.register('sw.js').then(function(registration) {
	    	console.log('ServiceWorker registrado: ', registration.scope);
	    }).catch(function(err) {
	    	console.log('ServiceWorker falhou: ', err);
	    });
  	});
}
*/

var data;
var ioWait=[];
var sortData;
var currentProcess;
var posHd=[];
var posRam=[];
var posPagesTable=[];
var waitListForIO=[];
var pageMemoryTime=[];
var ioDelay=5;
var extremeDeadline = 1000000;
var freeMemory, freeHd;
var nextFreePositionH, nextFreePositionR;
var mainForm = $("#main_form");
var processNumberInput = $("#process_number");
var quamtumNumberInput = $("#quamtum_number");
var overloadNumberInput = $("#overload_number");
var pageReplacementInput = $("#page_replacement");
var resetButton = $("#reset_btn");
var progressBar = $("#progress_bar");
var overlayPanel = $("#overlay_panel");
var innerOverlayPanel = $("#inner_overlay_panel");
var meanTurnaroundSpan = $("#mean_turnaround");

var processesInfoBox = $("#processes_info_box");
var graphsBox = $("#graphs_box");
var ganttGraph = $("#gantt_graph");
var visibleGanttGraphWidth = ganttGraph.width();
var progressGanttGraphWidth;
var maxGanttGraphCol = 30;
var scrollPosition = 65;
var lastScrollDelay = 0;

var errorModal = $("#error_modal");
var modalContent = $("#modal_content");
var replayBtn = $("#replay_btn");

var globalDelay = 0;
var green = "#4db6ac";
var red = "#e57373";
var grey = "#90a4ae";
var colors = ["#4db6ac", "#e57373", "#90a4ae"];

var memGraph = $("#mem_graph");
var hdGraph = $("#hd_graph");
var pagesGraph = $("#pages_graph");
var pagesTable = $('#draggable_pages_table');
var hideBtn = $("#hide_btn");
var	toggleBtn = $("#toggle_btn");
var	toggleContainer = $("#toggle_container");
var oldValue;

function colorizeBorder(y, x) {
	let square = $("#outer_square_"+y+"_"+x);
	square.css("border-left-color", "#303f9f");
}

function makeProgressInGanttSquare(y, x, color=green, _delay=(globalDelay+=600)) {
	if(x == maxGanttGraphCol) {
		let i = ++maxGanttGraphCol;
		ganttGraph.append('\
			<div class="my-gantt-col">\
				<div class="my-gantt-square"><span>'+i+'</span></div>\
				<div id="outer_square_9_'+i+'" class="my-gantt-square"><div id="inner_square_9_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_8_'+i+'" class="my-gantt-square"><div id="inner_square_8_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_7_'+i+'" class="my-gantt-square"><div id="inner_square_7_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_6_'+i+'" class="my-gantt-square"><div id="inner_square_6_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_5_'+i+'" class="my-gantt-square"><div id="inner_square_5_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_4_'+i+'" class="my-gantt-square"><div id="inner_square_4_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_3_'+i+'" class="my-gantt-square"><div id="inner_square_3_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_2_'+i+'" class="my-gantt-square"><div id="inner_square_2_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_1_'+i+'" class="my-gantt-square"><div id="inner_square_1_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_0_'+i+'" class="my-gantt-square"><div id="inner_square_0_'+i+'" class="my-gantt-inner-square"></div></div>\
			</div>\
		');
	}

	if(progressGanttGraphWidth == undefined) {
		progressGanttGraphWidth = x * 37 + 185;
	} else {
		progressGanttGraphWidth += 37;
	}

	let square = $("#inner_square_"+y+"_"+x);
	square.css('background-color', color);

	if(progressGanttGraphWidth >= visibleGanttGraphWidth) {
		ganttGraph.delay(_delay - lastScrollDelay).animate({scrollLeft:scrollPosition}, 400);
		lastScrollDelay = _delay;
		scrollPosition += 65;
	}

	square.velocity({width: "100%"}, {duration:600, delay: _delay, mobileHA: false});
}

function meanTurnAround() {
	let turnAround = 0;
	for(let i = 0; i < sortData.length; i++) {
		turnAround+=(sortData[i]._endTime - sortData[i]._start);
	}
	return (turnAround/sortData.length).toFixed(2);
}

function setProcessInRAM(pageFrame, _process) {
	setTimeout(function(){
		let square = $("#mem_page_"+pageFrame);
		let element = $("#mem_page_"+pageFrame+" span ~ span");
		
		square.css('background-color', '#b2dfdb');
		element.html('P '+_process);
	}, globalDelay + 600);
}

function removeProcessFromRAM(pageFrame) {
	setTimeout(function(){
		let square = $("#mem_page_"+pageFrame);
		let element = $("#mem_page_"+pageFrame+" span ~ span");
		
		square.css('background-color', '#fff');
		element.html('P x');
	}, globalDelay + 600);
}

function setProcessInHD(local, _process) {
	setTimeout(function(){
		let square = $("#hd_page_"+local);
		let element = $("#hd_page_"+local+" span ~ span");
		
		square.css('background-color', '#b2dfdb');
		element.html('P '+_process);
	}, globalDelay + 600);
}

function removeProcessFromHD(local) {
	setTimeout(function(){
		let square = $("#hd_page_"+local);
		let element = $("#hd_page_"+local+" span ~ span");
		
		square.css('background-color', '#fff');
		element.html('P x');
	}, globalDelay + 600);
}

function setTablePages(virtualPage, pageFrame) {
	setTimeout(function(){
		let element = $("#pages_page_"+virtualPage+" span:nth-child(2)");
		element.html('F '+pageFrame);
	}, globalDelay + 600);
}

function resetTablePages(virtualPage) {
	setTimeout(function(){
		let element = $("#pages_page_"+virtualPage+" span:nth-child(2)");
		element.html('F x');
	}, globalDelay + 600);
}

function setTablePagesBit(virtualPage) {
	setTimeout(function(){
		let square = $("#pages_page_"+virtualPage);
		let _element = $("#pages_page_"+virtualPage+" span:nth-child(3)");
		square.css('background-color', '#b2dfdb');
		_element.html('Bit 1');
	}, globalDelay + 600);
}

function resetTablePagesBit(virtualPage) {
	setTimeout(function(){
		let square = $("#pages_page_"+virtualPage);
		let _element = $("#pages_page_"+virtualPage+" span:nth-child(3)");
		square.css('background-color', '#fff');
		_element.html('Bit 0');
	}, globalDelay + 600);
}

function beginHdAndRamAndPagesTableAndIoLists() {
	var procIn = -1;
	var timeIni = -1;
	var allPages=10;
	for(let i=0; i<10; i++){
		posHd[i] = {
			"_proc" : parseInt(procIn)
		}
	}
	for(let i=0; i<5; i++){
		posRam[i] = {
			"_proc" : parseInt(procIn),
			"_qtdPaginas" : parseInt(allPages)
		}
	}
	for(let i=0; i<5; i++){
		pageMemoryTime[i] = {
			"_time" : parseInt(timeIni),
			"_proc" : parseInt(procIn)
		}
	}
	for(let i=0; i<10; i++){
		posPagesTable[i] = {
			"_proc" : parseInt(procIn)
		}
	}
}

function sortByArrivalTime() {
	sortData = [];
	var start;
	var time;
	var deadline;
	var timeLeft;
	var position;
	var io = 0;
	var processNumber;
	var endTime=0;
	var hd1=-1;

	for(let i = 0; i < data.length; i++) {
		sortData[i] = {
			"_start"         : parseInt(data[i]._start), 
			"_time"          : parseInt(data[i]._time),
			"_deadline"      : parseInt(data[i]._deadline + data[i]._start),
			"_timeLeft"      : parseInt(data[i]._time),
			"_processNumber" : parseInt(i),
			"_makingIO"      : parseInt(io),
			"_endTime"       : parseInt(endTime),
			"_memoria"		 : parseInt(hd1),
			"_hd"			 : parseInt(hd1),
			"_rr"			 : parseInt(io),
			"_exe"			 : parseInt(io)
		};
	}

	for(let i = 0; i < sortData.length; i++) {
		position = i;
		for(let j = i+1; j<sortData.length; j++) {
			if(sortData[position]._start > sortData[j]._start) {
				position = j;
			}
		}
		if(position != i){
			start = sortData[i]._start;
			time = sortData[i]._time;
			deadline = sortData[i]._deadline;
			timeLeft = sortData[i]._timeLeft;
			processNumber =  sortData[i]._processNumber;
			sortData[i]._start = sortData[position]._start;
			sortData[i]._time = sortData[position]._time;
			sortData[i]._deadline = sortData[position]._deadline;
			sortData[i]._timeLeft = sortData[position]._timeLeft;
			sortData[i]._processNumber = sortData[position]._processNumber;
			sortData[position]._start = start;
			sortData[position]._time = time;
			sortData[position]._deadline =  deadline;
			sortData[position]._timeLeft = timeLeft;
			sortData[position]._processNumber = processNumber;
		}
	}
}

processNumberInput.on('change', function(event) {
	event.preventDefault();
	processesInfoBox.empty();
	let n = parseInt(processNumberInput.val());
	for (let i = 0; i < n; i++) {
		processesInfoBox.append(
			'<div class="col s12 m4">\
				<div class="card">\
			        <div class="card-content">\
			        	<span class="card-title my-no-m-b">Processo '+i+'</span>\
			        	<div class="row my-no-m-b">\
					        <div class="input-field col s4">\
					        	<input id="process_'+i+'_start" type="text" class="0-to-99" autocomplete="off">\
					        	<label for="process_'+i+'_start">Chegada</label>\
					        </div>\
							<div class="input-field col s4">\
					        	<input id="process_'+i+'_time" type="text" class="0-to-99" autocomplete="off">\
					        	<label for="process_'+i+'_time">Tempo</label>\
					        </div>\
					        <div class="input-field col s4">\
					        	<input id="process_'+i+'_deadline" type="text" class="0-to-99" autocomplete="off">\
					        	<label for="process_'+i+'_deadline">Deadline</label>\
					        </div>\
						</div>\
			        </div>\
			    </div>\
		    </div>'
		);
	}
	$('.0-to-99').mask('00');
	graphsBox.hide(0, function() {
		processesInfoBox.show('fast');
	});
});

mainForm.on('submit', function(event) {
	event.preventDefault();
	let n = parseInt(processNumberInput.val()), errorMsg = ""; data = [];
	if(!(processNumberInput.val()).length) {
		errorMsg += "Número de processos não pode ser nulo!<br>";
	} else {
		for (let i = 0; i < n; i++) {
			if(!($("#process_"+i+"_start").val()).length || !($("#process_"+i+"_time").val()).length || !($("#process_"+i+"_deadline").val()).length) {
				errorMsg += "Dados do processo "+i+" estão incompletos!<br>";
			} else {
				data[i] = {
					"_start"    : parseInt($("#process_"+i+"_start").val()), 
					"_time"     : parseInt($("#process_"+i+"_time").val()),
					"_deadline" : parseInt($("#process_"+i+"_deadline").val()),
				};
			}
		}
		data["processes"] = parseInt(processNumberInput.val());
	}
	if (!(quamtumNumberInput.val()).length) {
		errorMsg += "Quamtum não pode ser nulo!<br>";
	} else {
		data["quantum"] = parseInt(quamtumNumberInput.val()); 
	}  
	if (!(overloadNumberInput.val()).length) {
		errorMsg += "Sobrecarga não pode ser nulo!<br>";
	} else {
		data["overload"] = parseInt(overloadNumberInput.val()); 
	}
	if(!(errorMsg).length) {
		processesInfoBox.hide(0, function(){
			graphsBox.show('fast');
			progressBar.show('fast');
			overlayPanel.show('fast');
		});
		data["algorithm"] = $("input[name=algorithm]:checked", "#main_form").val();
		data["pageReplacement"] = pageReplacementInput.val();
		for (let i = 0; i < n; i++) {
			$("#outer_info_square_"+i+"_0 span").html(data[i]._start);
			$("#outer_info_square_"+i+"_1 span").html(data[i]._time);
			$("#outer_info_square_"+i+"_2 span").html(data[i]._deadline);
			$("#outer_info_square_"+i+"_3 span").html(i);
		}
		sortByArrivalTime();
		beginHdAndRamAndPagesTableAndIoLists();
		main();
	} else {
		modalContent.html(errorMsg);
		errorModal.modal('open');
	}
});

resetButton.on('click', function(event) {
	processesInfoBox.empty();
	processesInfoBox.hide(0, function() {
		graphsBox.show('fast');
	});
});

replayBtn.on('click', function(event) {
	event.preventDefault();
	location.reload();
});		

pagesTable.resize(function() {
	let width = pagesTable.width();
	if(width > 520) {
		pagesGraph.css('justify-content', 'center');
	} else {
		pagesGraph.css('justify-content', 'flex-start');
	}
});

processNumberInput.on('input', function(event) {
	var newValue = processNumberInput.val();
	if(!newValue.length) {
		oldValue = undefined; 
	} else if (parseInt(newValue) < 1) {
		processNumberInput.val(oldValue);
	} else if (parseInt(newValue) > 10) {
		processNumberInput.val(oldValue);
	} else {
		oldValue = newValue;
	}
});

hideBtn.on('click', function(event) {
	event.preventDefault();
	pagesTable.toggle();
	toggleContainer.toggle();
});

toggleBtn.on('click', function(event) {
	event.preventDefault();
	pagesTable.toggle();
	toggleContainer.toggle();
});

$( window ).resize(function() {
	visibleGanttGraphWidth = ganttGraph.width();
});

$(function() {
	$('.draggable').draggable();
	$('.resizable').resizable();
});

$( document ).ready(function() {
	$('select').formSelect();
	$('.modal').modal();
	$('.numbers').mask('0#');
	$('.1-to-9').mask('n', {
	    translation: {
	      	'n': {
	    		pattern: /[1-9]/
	    	}
	    }
	});

	for (let d = ['TC', 'TE', 'D', 'Nº'], i = 0; i < 4; i++) {
		ganttGraph.append('\
			<div class="my-gantt-col">\
				<div class="my-gantt-square"><span>'+d[i]+'</span></div>\
				<div id="outer_info_square_9_'+i+'" class="my-gantt-square"><span></span></div>\
				<div id="outer_info_square_8_'+i+'" class="my-gantt-square"><span></span></div>\
				<div id="outer_info_square_7_'+i+'" class="my-gantt-square"><span></span></div>\
				<div id="outer_info_square_6_'+i+'" class="my-gantt-square"><span></span></div>\
				<div id="outer_info_square_5_'+i+'" class="my-gantt-square"><span></span></div>\
				<div id="outer_info_square_4_'+i+'" class="my-gantt-square"><span></span></div>\
				<div id="outer_info_square_3_'+i+'" class="my-gantt-square"><span></span></div>\
				<div id="outer_info_square_2_'+i+'" class="my-gantt-square"><span></span></div>\
				<div id="outer_info_square_1_'+i+'" class="my-gantt-square"><span></span></div>\
				<div id="outer_info_square_0_'+i+'" class="my-gantt-square"><span></span></div>\
			</div>\
		');
	}
	for (let i = 0; i < 31; i++) {
		ganttGraph.append('\
			<div class="my-gantt-col">\
				<div class="my-gantt-square"><span>'+i+'</span></div>\
				<div id="outer_square_9_'+i+'" class="my-gantt-square"><div id="inner_square_9_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_8_'+i+'" class="my-gantt-square"><div id="inner_square_8_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_7_'+i+'" class="my-gantt-square"><div id="inner_square_7_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_6_'+i+'" class="my-gantt-square"><div id="inner_square_6_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_5_'+i+'" class="my-gantt-square"><div id="inner_square_5_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_4_'+i+'" class="my-gantt-square"><div id="inner_square_4_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_3_'+i+'" class="my-gantt-square"><div id="inner_square_3_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_2_'+i+'" class="my-gantt-square"><div id="inner_square_2_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_1_'+i+'" class="my-gantt-square"><div id="inner_square_1_'+i+'" class="my-gantt-inner-square"></div></div>\
				<div id="outer_square_0_'+i+'" class="my-gantt-square"><div id="inner_square_0_'+i+'" class="my-gantt-inner-square"></div></div>\
			</div>\
		');
	}

	for (let i = 0, j = 1; i < 10; i++) {
		if(j < 51) {
			var t = "blue-grey-text";
		} else {
			var t = "red-text text-lighten-2"
		}
		if (!(i==9)) {
			memGraph.append('\
				<div class="my-mem-col">\
					<div id="mem_page_'+j+'" class="my-mem-square my-t-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
				</div>\
			');
		} else {
			memGraph.append('\
				<div class="my-mem-col">\
					<div id="mem_page_'+j+'" class="my-mem-square my-r-b my-t-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="mem_page_'+j+'" class="my-mem-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
				</div>\
			');
		}
	}

	for (let i = 0, j = 1; i < 10; i++) {
		var t = "blue-grey-text";
		if (!(i==9)) {
			hdGraph.append('\
				<div class="my-hd-col">\
					<div id="hd_page_'+j+'" class="my-hd-square my-t-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
				</div>\
			');
		} else {
			hdGraph.append('\
				<div class="my-hd-col">\
					<div id="hd_page_'+j+'" class="my-hd-square my-r-b my-t-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
					<div id="hd_page_'+j+'" class="my-hd-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>P x</span></div>\
				</div>\
			');
		}
	}

	for (let i = 0, j = 1; i < 10; i++) {
		var t = "blue-grey-text";
		if (!(i==9)) {
			pagesGraph.append('\
				<div class="my-pages-col">\
					<div id="pages_page_'+j+'" class="my-pages-square my-t-b"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
				</div>\
			');
		} else {
			pagesGraph.append('\
				<div class="my-pages-col">\
					<div id="pages_page_'+j+'" class="my-pages-square my-r-b my-t-b"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
					<div id="pages_page_'+j+'" class="my-pages-square my-r-b"><span class="'+t+'">'+(j++)+'</span><span>F x</span><span>Bit 0</span></div>\
				</div>\
			');
		}
	}
});