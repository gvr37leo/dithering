/// <reference path="node_modules/utilsx/utils.ts" />
/// <reference path="node_modules/vectorx/vector.ts" />
/// <reference path="graphics.ts" />


var crret = createCanvas(800,600)
var canvas = crret.canvas
var ctxt = crret.ctxt
var gfx = new Graphics(ctxt)
var goldenratio = 1.61803398875

loadImages(['test.bmp']).then(arr => {
    var image = image2imagedata(arr[0])
    var ditheroffset1 = (y,mask) => y * mask.length * 0.5
    var ditheroffset2 = (y,mask) => y
    var ditheroffset3 = (y,mask) => 0
    var ditheroffset4 = (y,mask) => y * mask.length * (goldenratio - 1)
    dither(gfx,image,0,0,60,ditheroffset3)
    // calcfraction(0.67)
})


function dither(gfx:Graphics,image:ImageData,x:number,y:number,plateaus:number,ditherOffsetter:(y:number, mask:boolean[]) => number){
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
    var precision = 10
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
};

function calcdecplaces(number, precision){
    var res = 0
    while(number > precision){
        number *= 10
        number -= Math.floor(number)
        res++
    }
    return res
}