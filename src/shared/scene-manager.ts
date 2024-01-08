import * as PIXI from 'pixi.js';
import { ColorOverlayFilter } from "@pixi/filter-color-overlay";
import { GetRandomShipConfig } from "../shared/random-config";
import * as TWEEN from '@tweenjs/tween.js';
import { colors } from './constants';

export class Scene {

    private app: PIXI.Application;
    Stage: PIXI.Container;
    Renderer: PIXI.Renderer;
    Ticker: PIXI.Ticker;
    docksState: number[] = [0, 0, 0, 0];
    docksArray: any
    currentShipTargetIndex: number;
    shipInPort: boolean;
    shipCourseToSea: number;
    pointBeforeGate: number;
    queueOfRedShips = [];
    queueOfGreenShips = [];
    currentShipTarget;

    constructor(parent: HTMLElement, width: number, height: number) {

        this.app = new PIXI.Application({ width, height, backgroundColor: colors.blue });
        parent.replaceChild(this.app.view, parent.lastElementChild);
        this.Renderer = this.app.renderer;
        this.Stage = this.app.stage;
        this.Ticker = this.app.ticker
        this.init();
        this.app.ticker.add(delta => {
            this.play();
        })

    }

    init() {
        this.addGates()
        this.addDocks(2, 110)
        this.docksArray = (this.Stage.children[1])
        this.renderShip()
        setInterval(() => { this.renderShip() }, 8000);
        this.Ticker.add((delta) => this.gameLoop());
    }

    renderShip() {
        const { color, fill, posY, posX } = GetRandomShipConfig();
        const ship = this.addShip(posX, posY, color, fill);

        if (color === '0xFF0000') {
            ship.filters = [new ColorOverlayFilter(colors.red)];
        }

        if (color === '0xFF0000') {
            this.currentShipTargetIndex = this.docksState.findIndex((loadValue) => loadValue === 0);

            if ((this.queueOfRedShips.length) || (this.currentShipTargetIndex === -1) || (this.shipInPort)) {
                this.queueOfRedShips.push(ship);
                this.moveInQueue(ship, color);
            } else {
                this.shipCourseToSea = 190;
                this.enterThePort(ship, color, this.docksArray.children[this.currentShipTargetIndex]);
            }
        } else {
            this.currentShipTargetIndex = this.docksState.findIndex((loadValue) => loadValue === 1);

            if ((this.queueOfGreenShips.length) || (this.currentShipTargetIndex === -1) || (this.shipInPort)) {
                this.queueOfGreenShips.push(ship);
                this.moveInQueue(ship, color);
                this.pointBeforeGate = (this.queueOfGreenShips.length + 2) * 100;
            } else {
                this.currentShipTarget = this.docksArray.children[this.currentShipTargetIndex];
                this.enterThePort(ship, color, this.docksArray.children[this.currentShipTargetIndex]);
                this.shipCourseToSea = 290;
            }
        }
        this.Stage.addChild(ship);
    }

    enterThePort(ship, shipType, target) {
        this.shipInPort = true;
        this.currentShipTarget = target;

        const handleShipInDock = (shipType) => {
            if (shipType === '0x1F8A0A') {
                ship.filters = [new ColorOverlayFilter(0x1F8A0A)];
                this.docksState[this.currentShipTargetIndex] = 0;
                this.shipCourseToSea = 190;
            }
            if (shipType === "0xFF0000") {
                ship.filters = null;
                this.docksState[this.currentShipTargetIndex] = 1;
                this.shipCourseToSea = 290;
            }
        };

        const passGate = new TWEEN.Tween(ship).to({ x: 150 }, 2000);
        const inFrontOfDock = new TWEEN.Tween(ship).to({ y: this.currentShipTarget.y + 40 }, 500);
        const moorShip = new TWEEN.Tween(ship).to({ x: this.currentShipTarget.x + 45 }, 750);
        const unmooreShip = new TWEEN.Tween(ship).to({ x: 150 }, 750).delay(1500);
        const setCourseY = new TWEEN.Tween(ship).to({ y: this.shipCourseToSea }, 500);
        const moveToSea = new TWEEN.Tween(ship).to({ x: 1000 }, 3000)
            .easing(TWEEN.Easing.Sinusoidal.In);

        passGate.onComplete(() => {
            this.shipInPort = true;

            inFrontOfDock.onComplete(() => moorShip.onComplete(() => {
                setTimeout(() => handleShipInDock(shipType), 750);
                unmooreShip.onComplete(() => setCourseY.onComplete(() => {
                    this.shipInPort = false;
                    this.handleShipsQueue();
                    moveToSea.start();
                })
                    .start())
                    .start();
            })
                .start())
                .start();
        })
            .start();
    }

    moveInQueue(ship, shipType) {
        if ((shipType === "0xFF0000") && (this.queueOfRedShips.length)) {
            let pointBeforeGateRed = (this.queueOfRedShips.length + 2) * 100;
            new TWEEN.Tween(ship).to({ x: pointBeforeGateRed }, 1000).start();
        }

        if ((shipType === "0x1F8A0A") && (this.queueOfGreenShips.length)) {
            let pointBeforeGateGreen = (this.queueOfGreenShips.length + 2) * 100;
            new TWEEN.Tween(ship).to({ x: pointBeforeGateGreen }, 1000).start();
        }
    }

    handleShipsQueue() {
        if (this.queueOfGreenShips.length) {
            const index = this.docksState.findIndex((value) => value === 1);

            if (index !== -1 && this.shipInPort === false) {
                this.enterThePort(this.queueOfGreenShips[0], 0x1F8A0A, this.docksArray.children[index]);
                this.queueOfGreenShips.shift();
                this.moveShipsInQueue(this.queueOfGreenShips);
            }
        }
        
        if (this.queueOfRedShips.length) {
            const index = this.docksState.findIndex((value) => value === 0);

            if (index !== -1 && this.shipInPort === false) {
                this.enterThePort(this.queueOfRedShips[0], colors.red, this.docksArray.children[index]);
                this.queueOfRedShips.shift();
                this.moveShipsInQueue(this.queueOfRedShips);
            }
        }
    }

    moveShipsInQueue(shipsInQueue) {
        let beforeGates = 300;

        for (let i = 0; i < shipsInQueue.length; i++) {
            const moveShipsInQuee = new TWEEN.Tween(shipsInQueue[i]).to({ x: beforeGates }, 2000);
            beforeGates += 100;
            moveShipsInQuee.start();
        }
    }

    renderRect(color: number, fill: number, width: number, heigth: number, border: number) {
        const rect = new PIXI.Graphics();
        rect.lineStyle(border, color, 1);
        rect.beginFill(fill);
        rect.drawRect(0, 0, width, heigth);
        rect.endFill();
        return rect;
    }

    addShip(posX, posY, color, fill) {
        const graphics = this.renderRect(color, fill, 80, 30, 3);
        const texture = this.Renderer.generateTexture(graphics, 1, 1);
        const ship = new PIXI.Sprite(texture);
        ship.x = posX;
        ship.y = posY;
        this.Stage.addChild(ship);
        return ship;
    }

    addGates() {
        let gatesContainer = new PIXI.Container();
        let gateTop = new PIXI.Graphics();
        gateTop.lineStyle(10, colors.yellow, 1);
        gateTop.position.set(250, 0);
        gateTop.moveTo(10, 0);
        gateTop.lineTo(10, this.Renderer.height / 2 - 100);
        let gateBottom = new PIXI.Graphics();
        gateBottom.lineStyle(10, colors.yellow, 1);
        gateBottom.position.set(250, 0);
        gateBottom.moveTo(10, this.Renderer.height);
        gateBottom.lineTo(10, this.Renderer.height / 2 + 100);
        gatesContainer.addChild(gateTop);
        gatesContainer.addChild(gateBottom);
        this.Stage.addChild(gatesContainer);
    }

    addDocks(border: number, heigth: number) {
        let containerDocks = new PIXI.Container();
        this.Stage.addChild(containerDocks);
        let spacer = heigth + 5;

        for (let i = 0; i < 4; i++) {
            const graphics = this.renderRect(colors.yellow, colors.blue, 40, 110, 3);
            const texture = this.Renderer.generateTexture(graphics, 1, 1)
            const dock = new PIXI.Sprite(texture);
            dock.x = border;
            dock.y = i * spacer + 1;
            containerDocks.addChild(dock);
            this.docksArray = containerDocks
        }
    }

    gameLoop() {
        this.play();
        TWEEN.update();
        this.Renderer.render(this.Stage);
    }

    play() {
        this.docksState.forEach((loadValue, i) => {
            if (loadValue === 1) {
                this.docksArray.children[i].filters = [new ColorOverlayFilter(colors.yellow)];
            } else {
                this.docksArray.children[i].filters = null;
            }
        });
    }
}