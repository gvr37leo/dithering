class Graphics{
    imageData:ImageData

    constructor(public ctxt:CanvasRenderingContext2D){
        this.ctxt = ctxt
    }

    load(){
        this.imageData = this.ctxt.getImageData(0,0,this.ctxt.canvas.width,this.ctxt.canvas.height)
    }

    flush(){
        this.ctxt.putImageData(this.imageData,0,0)
    }

    putPixel(x,y,vals:number[]){
        var i = this.index(x,y)
        var data = this.imageData.data
        data[i] = vals[0]
        data[i + 1] = vals[1]
        data[i + 2] = vals[2]
        data[i + 3] = vals[3]
    }

    getPixel(x,y):number[]{
        var i = this.index(x,y)
        var data = this.imageData.data
        return [data[i],data[i + 1],data[i + 2],data[i + 3]]
    }

    getWidth(){
        return this.ctxt.canvas.width
    }

    getHeight(){
        return this.ctxt.canvas.height
    }

    index(x,y){
        return (this.getWidth() * y + x) * 4
    }
}