// Global type declarations for Phaser (dynamically loaded)
// This prevents TypeScript errors during build while Phaser is loaded at runtime

declare namespace Phaser {
    const AUTO: number
    const WEBGL: number
    const CANVAS: number

    class Game {
        constructor(config: any)
        destroy(removeCanvas?: boolean): void
    }

    class Scene {
        add: any
        input: any
        time: any
        load: any
        cameras: any
    }

    namespace GameObjects {
        class Rectangle {
            x: number
            y: number
            getBounds(): any
            setFillStyle(color: number, alpha?: number): this
            destroy(): void
        }
        class Arc {
            x: number
            y: number
            getBounds(): any
            destroy(): void
        }
        class Text {
            x: number
            y: number
            setText(text: string): this
            setFillStyle(color: number): this
            destroy(): void
        }
        class Sprite {
            x: number
            y: number
            setTexture(key: string): this
            destroy(): void
        }
    }

    namespace Math {
        function Between(min: number, max: number): number
        function Clamp(value: number, min: number, max: number): number
    }

    namespace Geom {
        namespace Rectangle {
            function Overlaps(rectA: any, rectB: any): boolean
        }
        namespace Intersects {
            function RectangleToRectangle(rectA: any, rectB: any): boolean
        }
    }

    namespace Input {
        namespace Keyboard {
            class KeyboardPlugin {
                addKey(keyCode: number): any
                createCursorKeys(): any
            }
        }
    }
}

// Also declare module for require() usage
declare module 'phaser' {
    export = Phaser
}
