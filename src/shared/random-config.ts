enum colors {
    red = "0xFF0000",
    green = "0x1F8A0A",
    blue = "0x0437f7",
}

type Config = {
    color: string;
    fill: string;
    posY: number;
    posX: number
}

export function GetRandomShipConfig(): Config {
    let fill='';
    let posY=0;
    const posX=900;
    const arr: string[] = [colors.red, colors.green];
    const color: string = arr[Math.round(Math.random())];

    if (color === colors.red) {
        fill = colors.blue;
        posY = 140;
    }

    if (color === colors.green) {
        fill = colors.blue;
        posY = 240;
    }
    
    return {
        color,
        fill,
        posY,
        posX,
    };
}