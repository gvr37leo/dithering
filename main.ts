/// <reference path="node_modules/utilsx/utils.ts" />
/// <reference path="node_modules/vectorx/vector.ts" />
/// <reference path="graphics.ts" />



let canvas = document.querySelector('canvas')
let ctxt = canvas.getContext('2d')
let gfx = new Graphics(ctxt)
let goldenratio = 1.61803398875

let testimagesinput = document.querySelector('#testimages') as HTMLSelectElement
let ditherlevelinput = document.querySelector('#levels') as HTMLInputElement
let patternlengthinput = document.querySelector('#patternlength') as HTMLInputElement
let offsetmethodinput = document.querySelector('#offsetmethod') as HTMLSelectElement

let ditheroffset1 = (y,mask) => y * mask.length * 0.5
let ditheroffset2 = (y,mask) => y
let ditheroffset3 = (y,mask) => 0
let ditheroffset4 = (y,mask) => y * mask.length * (goldenratio - 1)
var ditherOffsetters = [ditheroffset1,ditheroffset2,ditheroffset3,ditheroffset4]
let ditherfunc = ditheroffset1
let ditherlevels = ditherlevelinput.valueAsNumber
let gdcprecision = patternlengthinput.valueAsNumber
let globalimage = null

loadImages(['res/verticalgradient.bmp']).then(arr => {
    globalimage = image2imagedata(arr[0])
    gfx.ctxt.canvas.width = globalimage.width
    gfx.ctxt.canvas.height = globalimage.height
    gfx.ctxt.clearRect(0,0,globalimage.width,globalimage.height)
    calldither()
})

let urlinput = document.querySelector('#imageinput')
var preview = document.querySelector('img')



testimagesinput.addEventListener('change', e => {
    preview.src = testimagesinput.value
    loadImages([testimagesinput.value]).then(arr => {
        globalimage = image2imagedata(arr[0])
        gfx.ctxt.canvas.width = globalimage.width
        gfx.ctxt.canvas.height = globalimage.height
        gfx.ctxt.clearRect(0,0,globalimage.width,globalimage.height)
        calldither()
    })
})

ditherlevelinput.addEventListener('change', e => {
    ditherlevels = ditherlevelinput.valueAsNumber
    calldither()
})

patternlengthinput.addEventListener('change', e => {
    gdcprecision = patternlengthinput.valueAsNumber
    calldither()
})

offsetmethodinput.addEventListener('change', e => {
    ditherfunc = ditherOffsetters[parseInt(offsetmethodinput.value)]
    calldither()
})

urlinput.addEventListener('change', e => {
    var reader = new FileReader();
    reader.onload = function (e) {
        preview.src = e.target.result
        loadImages([e.target.result]).then(arr => {
            globalimage = image2imagedata(arr[0])
            gfx.ctxt.canvas.width = globalimage.width
            gfx.ctxt.canvas.height = globalimage.height
            gfx.ctxt.clearRect(0,0,globalimage.width,globalimage.height)
            calldither()
        })
    };
    reader.readAsDataURL(urlinput.files[0]);
})



function calldither(){
    dither(gfx,globalimage,ditherlevels,ditherfunc)
}

function dither(gfx:Graphics,image:ImageData,plateaus:number,ditherOffsetter:(y:number, mask:boolean[]) => number){
    gfx.load()
    let masks = new Map<number,boolean[]>()
    masks.set(0,[false])
    if(plateaus % 2 == 0){masks.set(plateaus / 2,[false,true])}
    masks.set(plateaus,[true])

    for(let plateau = 1; plateau < Math.ceil(plateaus / 2); plateau++){
        let percentageStrength = plateau / plateaus
        let fraction = calcfraction(percentageStrength)
        let num = fraction[0]
        let den = fraction[1]
        let mask = calcMaskSegment(num, den)
        masks.set(plateau, mask)
        masks.set(plateaus - plateau, mask.map(v => !v))
    }

    new Vector(image.width,image.height).loop2d(v => {
        let index = (image.width * v.y + v.x) * 4
        let color = image.data.slice(index,index + 4)
        let average = (color[0] + color[1] + color[2]) / 3
        let plateau = Math.round(map(average,0,255,0,plateaus))
        let mask = masks.get(plateau)
        if(mask[(v.x + Math.floor(ditherOffsetter(v.y,mask))) % mask.length]){
            gfx.putPixel(v.x,v.y,[255,255,255,255])
        }else{
            gfx.putPixel(v.x,v.y,[0,0,0,255])
        }
    })
    gfx.flush()
}



//fill <= length
function calcMaskSegment(fill:number,length:number):boolean[]{
    var res:boolean[] = new Array(length).fill(false)
    var space = length / fill
    var start = space / 2
    var jump = space
    var j = 0;
    for(var i = start; j < fill; i += jump){
        res[Math.floor(i)] = true
        j++
    }
    return res
}

function loadImages(urls:string[]):Promise<HTMLImageElement[]>{
    var promises:Promise<HTMLImageElement>[] = []

    for(var url of urls){
        promises.push(new Promise((res,rej) => {
            var image = new Image()
            image.onload = e => {
                res(image)     
            }
            image.src = url
        }))
    }

    return Promise.all(promises)
}

function image2imagedata(img:HTMLImageElement){
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0 );
    return context.getImageData(0, 0, img.width, img.height);
}

function calcfraction(decimal:number):number[]{
    var integral = Math.floor(decimal)
    var fraction = decimal - integral
    var precision = gdcprecision
    var roundFraction = Math.round(precision * fraction)
    var gcd = calcgcd(roundFraction, precision)
    var numerator = roundFraction / gcd
    var denomenator = precision / gcd
    return [numerator, denomenator]
}

function calcgcd(a, b) {
    if (a == 0)
        return b;
    else if (b == 0)
        return a;

    if (a < b)
        return calcgcd(a, b % a);
    else
        return calcgcd(b, a % b);
}