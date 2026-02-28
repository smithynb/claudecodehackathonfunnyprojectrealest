import {
  createCliRenderer,
  FrameBufferRenderable,
  RGBA,
  type KeyEvent,
} from "@opentui/core"
import { createGameState, tickGame } from "./src/game.ts"
import { handleKeypress } from "./src/input.ts"
import { renderGarden, getGardenLayout } from "./src/renderer/gardenRenderer.ts"
import { renderHud, HUD_HEIGHT } from "./src/renderer/hudRenderer.ts"
import { renderStatus, STATUS_HEIGHT } from "./src/renderer/statusRenderer.ts"
import { renderShop } from "./src/renderer/shopRenderer.ts"

async function main() {
  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
    targetFps: 15,
    useMouse: false,
  })

  const state = createGameState()

  const canvas = new FrameBufferRenderable(renderer, {
    id: "game-canvas",
    width: Math.max(1, renderer.width),
    height: Math.max(1, renderer.height),
  })

  renderer.root.add(canvas)

  const BG = RGBA.fromHex("#1A1A2E")
  const WARNING = RGBA.fromHex("#EF5350")
  const HINT = RGBA.fromHex("#90A4AE")

  let lastTime = Date.now()
  let destroyed = false

  const minGardenWidth = state.gridCols * 3 + 1
  const minGardenHeight = state.gridRows * 2 + 1

  const quit = () => {
    if (destroyed) {
      return
    }
    destroyed = true
    clearInterval(tickInterval)
    process.stdout.off("resize", handleResize)
    renderer.destroy()
  }

  const handleResize = () => {
    renderFrame()
  }

  process.stdout.on("resize", handleResize)

  function renderFrame() {
    if (destroyed) {
      return
    }

    const width = Math.max(1, renderer.width)
    const height = Math.max(1, renderer.height)

    if (canvas.width !== width) {
      canvas.width = width
    }
    if (canvas.height !== height) {
      canvas.height = height
    }

    const fb = canvas.frameBuffer
    if (!fb) return

    const now = Date.now()
    const delta = now - lastTime
    lastTime = now

    // Tick game logic
    tickGame(state, delta)

    fb.fillRect(0, 0, width, height, BG)

    renderHud(fb, state, width, 0)

    const statusOffsetY = Math.max(HUD_HEIGHT, height - STATUS_HEIGHT)
    renderStatus(fb, state, width, statusOffsetY)

    const gardenAreaTop = HUD_HEIGHT
    const gardenAreaHeight = Math.max(0, statusOffsetY - gardenAreaTop)
    const gardenLayout = getGardenLayout(state, width - 2, gardenAreaHeight)

    if (gardenLayout) {
      const gardenOffsetX = Math.max(0, Math.floor((width - gardenLayout.width) / 2))
      const gardenOffsetY = gardenAreaTop + Math.max(0, Math.floor((gardenAreaHeight - gardenLayout.height) / 2))
      renderGarden(fb, state, gardenLayout, gardenOffsetX, gardenOffsetY)
    } else {
      const warning = "Terminal too small to render the garden grid."
      const hint = `Need at least ${minGardenWidth}x${HUD_HEIGHT + STATUS_HEIGHT + minGardenHeight}.`
      if (gardenAreaTop + 1 < statusOffsetY) {
        fb.drawText(warning.substring(0, Math.max(0, width - 2)), 1, gardenAreaTop + 1, WARNING, BG)
      }
      if (gardenAreaTop + 2 < statusOffsetY) {
        fb.drawText(hint.substring(0, Math.max(0, width - 2)), 1, gardenAreaTop + 2, HINT, BG)
      }
    }

    if (state.shopOpen) {
      const centerX = Math.floor(width / 2)
      const centerY = Math.floor(height / 2)
      renderShop(fb, state, centerX, centerY)
    }
  }

  renderer.keyInput.on("keypress", (key: KeyEvent) => {
    handleKeypress(state, key as any, quit)
    if (!destroyed) {
      renderFrame()
    }
  })

  renderFrame()

  renderer.requestLive()
  renderer.start()

  const tickInterval = setInterval(() => {
    renderFrame()
  }, 500)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exitCode = 1
})
