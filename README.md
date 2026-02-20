# Buddhabrot Explorer

A real-time, interactive WebGPU explorer for the [Buddhabrot](https://superliminal.com/fractals/bbrot/) fractal, discovered by Melinda Green in 1993.

While the standard Mandelbrot set maps the "destination" of points on a complex plane (whether they remain bounded or escape to infinity), the Buddhabrot maps the **journey**. It logs the exact flight paths of all escaping points. When overlaid, these billions of paths create a glowing, meditative figure resembling a seated Buddha.

## Key Features

- **Nebulabrot (RGB Mode):** Maps different iteration counts to Red, Green, and Blue channels. This reveals the intricate "energy layers" of the fractal.
- **Juddhabrot (4D Rotation):** The underlying equation exists in four dimensions. This feature rotates the mathematical planes before projecting them to 2D, revealing hidden symmetries.
- **Real-time Orbit Tracking:** Hover over the fractal to see the live escape trace of that exact coordinate mapped out on the screen in real-time.
- **Color Highlight Mode:** Customize the glowing core of the fractal using a native color picker to tint the densest orbital crossing points.

## The Math & Philosophy

The calculation explores the equation: **$Z_{n+1} = Z_{n}^2 + C$**

We pick a random coordinate **$C$**, start **$Z$** at $0$, and iterate. If the value of $Z$ eventually grows larger than $2$, it "escapes". For the Buddhabrot, we re-run that exact escaping path and log every intermediate coordinate of $Z$ to a brightness map.

Because it reveals the "ghost" or the hidden structural beauty of chaos, the Buddhabrot has become a subject of both mathematical study and digital mysticism—a procedural intersection of sacred geometry and non-dual philosophy.

## Tech Stack

This explorer relies heavily on **WebGPU** and the **Three Shading Language (TSL)** via Three.js to run millions of concurrent flight path simulations per second. The UI and orbital math routing are handled by **React** and **TypeScript**. It also integrates with **CURBy** (Colorado University Randomness Beacon) for true quantum entanglement-seeded randomness.

## Development

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```
