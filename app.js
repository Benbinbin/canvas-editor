let vm = new Vue({
    el: '#app',
    data: {
        isDropping: false,
        fileName: '',
        fileType: '',
        img: null,
        fxCanvas: null,
        texture: null,
        canvas: null,
        ctx: null,
        width: 0,
        height: 0,
        brightness: 0,
        contrast: 0,
        radius: 5,
        strength: 0,
        rotate: 0,
        // skewButtonDisabled: true,
        showSkewController: false,
        controllerRadius: 15,
        skewReady: false,
        startDrag: false,
        dragTarget: null,
        originCoordinate: [0, 0, 0, 0, 0, 0, 0, 0],
        newCoordinate: [0, 0, 0, 0, 0, 0, 0, 0]
    },
    methods: {
        readImage() {
            let file = this.$refs.file.files[0];
            console.log(file);
            this.fileName = file.name.split('.')[0];
            this.fileType = file.name.split('.')[1];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                this.img = new Image();
                this.img.src = event.target.result;
                this.img.onload = () => {
                    this.setCanvas(this.img);
                }
            }
        },
        deleteImg() {
            this.img = null
        },
        setCanvas(val) {
            this.texture = this.fxCanvas.texture(val);
            this.fxCanvas.draw(this.texture).update();
            this.width = this.fxCanvas.width;
            this.height = this.fxCanvas.height;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.ctx.drawImage(this.fxCanvas, 0, 0, this.width, this.height);
            this.brightness = 0;
            this.contrast = 0;
            this.radius = 5;
            this.strength = 0;
            this.rotate = 0;
        },
        changeDirection(direction) {
            // console.log(direction);
            // console.log('changeDirection')
            this.canvas.width = this.height;
            this.canvas.height = this.width;
            this.rotateImage(direction);
            this.texture = this.fxCanvas.texture(this.canvas);
            this.fxCanvas.draw(this.texture).update();
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            this.rotateImage(this.rotate);
        },
        setDrag(event) {
            this.dragTarget = event.srcElement;
            this.startDrag = true;
        },
        initSkewController() {
            this.showSkewController = true;
            this.resetCoordinate();
        },
        resetCoordinate() {
            let { width, height } = this.getELemCoords(this.$refs.container);
            this.$refs.a.style.top = `${height * 0.1}px`;
            this.$refs.a.style.left = `${width * 0.1}px`;
            this.$refs.b.style.top = `${height * 0.1}px`;
            this.$refs.b.style.left = `${width * 0.9 - this.controllerRadius}px`;
            this.$refs.c.style.top = `${height * 0.9 - this.controllerRadius}px`;
            this.$refs.c.style.left = `${width * 0.9 - this.controllerRadius}px`
            this.$refs.d.style.top = `${height * 0.9 - this.controllerRadius}px`;
            this.$refs.d.style.left = `${width * 0.1}px`;
            let coordinate = [
                this.getDotCoords('a').x,
                this.getDotCoords('a').y,
                this.getDotCoords('b').x,
                this.getDotCoords('b').y,
                this.getDotCoords('c').x,
                this.getDotCoords('c').y,
                this.getDotCoords('d').x,
                this.getDotCoords('d').y,
            ];
            this.originCoordinate = coordinate;
        },
        move(event) {
            if (!this.startDrag) return;
            // 计算 dot 相对于 canvas-container 的坐标
            let { width, height, containerX, containerY } = this.getELemCoords(this.$refs.container)
            let x = 0,
                y = 0;
            if (event.type === 'touchmove') {
                let touch = event.touches[0];
                x = touch.pageX - containerX - this.controllerRadius / 2;
                y = touch.pageY - containerY - this.controllerRadius / 2;
            } else {
                x = event.pageX - containerX - this.controllerRadius / 2;
                y = event.pageY - containerY - this.controllerRadius / 2;
            }

            // 限制 dot 移动范围
            if (x >= 0 && x + this.controllerRadius <= width) {
                this.dragTarget.style.left = `${x}px`;
            } else if (x < 0) {
                this.dragTarget.style.left = '0'
            } else if (x + this.controllerRadius > width) {
                this.dragTarget.style.left = `${width - this.controllerRadius}px`
            }

            if (y >= 0 && y + this.controllerRadius <= height) {
                this.dragTarget.style.top = `${y}px`;
            } else if (y < 0) {
                this.dragTarget.style.top = '0'
            } else if (y + this.controllerRadius > width) {
                this.dragTarget.style.top = `${height - this.controllerRadius}px`
            }

            let coordinate = [
                this.getDotCoords('a').x,
                this.getDotCoords('a').y,
                this.getDotCoords('b').x,
                this.getDotCoords('b').y,
                this.getDotCoords('c').x,
                this.getDotCoords('c').y,
                this.getDotCoords('d').x,
                this.getDotCoords('d').y,
            ];

            // 基于状态判断 dot 移动时选择执行的操作
            if (this.skewReady) {
                this.skew(this.originCoordinate, coordinate)
            } else {
                this.originCoordinate = coordinate
            }
        },
        getELemCoords(elem) {
            let box = elem.getBoundingClientRect();

            return {
                width: box.width,
                height: box.height,
                containerX: box.left + window.pageXOffset,
                containerY: box.top + window.pageYOffset,
            };
        },
        getDotCoords(dot) {
            let x = parseFloat(this.$refs[dot].style.left);
            let y = parseFloat(this.$refs[dot].style.top);
            // console.log(dot, x, y)
            return {
                x,
                y
            }
        },
        skew(originCoordinate, newCoordinate) {
            this.fxCanvas.draw(this.texture).perspective(originCoordinate, newCoordinate).update();
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.ctx.drawImage(this.fxCanvas, 0, 0, this.width, this.height);
        },
        skewToBoundary() {
            let { width, height } = this.getELemCoords(this.$refs.temp)
            this.$refs.a.style.top = `0px`;
            this.$refs.a.style.left = `0px`;
            this.$refs.b.style.top = `0px`;
            this.$refs.b.style.left = `${width - this.controllerRadius}px`;
            this.$refs.c.style.top = `${height - this.controllerRadius}px`;
            this.$refs.c.style.left = `${width - this.controllerRadius}px`;
            this.$refs.d.style.top = `${height - this.controllerRadius}px`;
            this.$refs.d.style.left = `0px`;
            let coordinate = [
                this.getDotCoords('a').x,
                this.getDotCoords('a').y,
                this.getDotCoords('b').x,
                this.getDotCoords('b').y,
                this.getDotCoords('c').x,
                this.getDotCoords('c').y,
                this.getDotCoords('d').x,
                this.getDotCoords('d').y,
            ];
            console.log(coordinate);
            this.skew(this.originCoordinate, coordinate)

            // Ref: https://docs.opencv.org/4.2.0/dd/d52/tutorial_js_geometric_transformations.html

            // let scaleFactor = parseInt

            // let coordinate = [0, 0, width - this.controllerRadius, 0, width - this.controllerRadius, height - this.controllerRadius, 0, height - this.controllerRadius];

            // let src = cv.imread(this.$refs.temp);
            // let dst = new cv.Mat();
            // let dsize = new cv.Size(this.$refs.temp.width, this.$refs.temp.height);
            // let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, this.originCoordinate);
            // let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, coordinate);
            // let M = cv.getPerspectiveTransform(srcTri, dstTri);
            // // You can try more different parameters
            // cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
            // cv.imshow(this.$refs.temp, dst);
            // src.delete(); dst.delete(); M.delete(); srcTri.delete(); dstTri.delete();


        },
        restSkew() {
            this.$refs.a.style.left = `${this.originCoordinate[0]}px`;
            this.$refs.a.style.top = `${this.originCoordinate[1]}px`;
            this.$refs.b.style.left = `${this.originCoordinate[2]}px`;
            this.$refs.b.style.top = `${this.originCoordinate[3]}px`;
            this.$refs.c.style.left = `${this.originCoordinate[4]}px`;
            this.$refs.c.style.top = `${this.originCoordinate[5]}px`;
            this.$refs.d.style.left = `${this.originCoordinate[6]}px`;
            this.$refs.d.style.top = `${this.originCoordinate[7]}px`;
            this.skew(this.originCoordinate, this.originCoordinate);
        },
        cancelSkew() {
            if (this.skewReady) {
                this.skew(this.originCoordinate, this.originCoordinate)
            }
            this.finishSkew()
        },
        finishSkew() {
            this.texture = this.fxCanvas.texture(this.canvas);
            this.rotate = 0;
            this.dragTarget = null;
            this.startDrag = false;
            this.resetCoordinate();
            this.skewReady = false;
            this.showSkewController = false;
        },
        filter() {
            this.fxCanvas.draw(this.texture).brightnessContrast(this.brightness, this.contrast).unsharpMask(this.radius, this.strength).update();
            this.ctx.drawImage(this.fxCanvas, 0, 0, this.width, this.height);
            this.rotateImage(this.rotate);
        },
        rotateImage(degree) {
            // console.log(degree)
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.save();
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.rotate(degree * Math.PI / 180);
            this.ctx.drawImage(this.fxCanvas, -this.width / 2, -this.height / 2, this.width, this.height);
            this.ctx.restore();
        },
        downloadImg() {
            const link = document.createElement('a');
            const data = this.canvas.toDataURL();
            link.href = data;
            link.download = `${this.fileName}-edited.${this.fileType}`;
            link.click();
        }
    },
    mounted() {
        this.fxCanvas = fx.canvas();
        this.canvas = this.$refs.temp;
        this.ctx = this.canvas.getContext('2d');
    }
})

// function onOpenCvReady() {
//     vm.$data.skewButtonDisabled = false;
// }