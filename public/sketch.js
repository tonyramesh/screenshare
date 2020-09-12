let color = '#000'
let strokeWidth = 4
let cv

function setup() {
	cv = createCanvas(document.getElementById('accordionExample').offsetWidth, document.getElementById('accordionExample').offsetHeight - 300)
	cv.background(255, 255, 255)
	cv.parent('container');

	socket.on('mouse', data => {
		stroke(data.color)
		strokeWeight(data.strokeWidth)
		line(data.x, data.y, data.px, data.py)
	})

	const color_picker = select('#pickcolor')
	const color_btn = select('#color-btn')
	const color_holder = select('#color-holder')

	const stroke_width_picker = select('#stroke-width-picker')
	const stroke_btn = select('#stroke-btn')


	color_btn.mousePressed(() => {
		if (/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color_picker.value())) {
			color = color_picker.value()
		} else {
			console.log('Enter a valid hex value')
		}
	})
	stroke_btn.mousePressed(() => {
		const width = parseInt(stroke_width_picker.value())
		if (width > 0) strokeWidth = width
	})
}

function windowResized() {
	cv.resizeCanvas(windowWidth / 2, windowHeight / 2, false)
}

function mouseDragged() {
	stroke(color)
	strokeWeight(strokeWidth)
	line(mouseX, mouseY, pmouseX, pmouseY)
	sendmouse(mouseX, mouseY, pmouseX, pmouseY)
}

function sendmouse(x, y, pX, pY) {
	const data = {
		x: x,
		y: y,
		px: pX,
		py: pY,
		color: color,
		strokeWidth: strokeWidth,
	}
	socket.emit('mouse', broadcasterId, data)
}