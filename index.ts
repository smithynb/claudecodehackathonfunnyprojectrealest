import {
  createCliRenderer,
  FrameBufferRenderable,
  RGBA,
  type KeyEvent,
} from "@opentui/core"
import { createGameState, tickGame } from "./src/game.ts"
import { handleKeypress } from "./src/input.ts"
import { renderGarden, getGardenPixelSize } from "./src/renderer/gardenRenderer.ts"
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

  // Calculate dimensions
  const gardenSize = getGardenPixelSize(state)
  const totalWidth = Math.max(gardenSize.width + 2, 60)
  const totalHeight = HUD_HEIGHT + gardenSize.height + STATUS_HEIGHT + 2

  // Create the main FrameBuffer
  const canvas = new FrameBufferRenderable(renderer, {
    id: "game-canvas",
    width: totalWidth,
    height: totalHeight,
  })

  renderer.root.add(canvas)

  const BG = RGBA.fromHex("#1A1A2E")

  // Track time for game ticks
  let lastTime = Date.now()

  function renderFrame() {
    const fb = canvas.frameBuffer
    if (!fb) return

    const now = Date.now()
    const delta = now - lastTime
    lastTime = now

    // Tick game logic
    tickGame(state, delta)

    // Clear entire canvas
    fb.fillRect(0, 0, totalWidth, totalHeight, BG)

    // Render HUD at top
    renderHud(fb, state, totalWidth, 0)

    // Render garden grid
    const gardenOffsetX = 1
    const gardenOffsetY = HUD_HEIGHT
    renderGarden(fb, state, gardenOffsetX, gardenOffsetY)

    // Render status bar at bottom
    const statusOffsetY = HUD_HEIGHT + gardenSize.height + 1
    renderStatus(fb, state, totalWidth, statusOffsetY)

    // Render shop overlay if open
    if (state.shopOpen) {
      const centerX = Math.floor(totalWidth / 2)
      const centerY = Math.floor(totalHeight / 2)
      renderShop(fb, state, centerX, centerY)
    }
  }

  // Keyboard input
  renderer.keyInput.on("keypress", (key: KeyEvent) => {
    handleKeypress(state, key as any, () => {
      renderer.destroy()
      process.exit(0)
    })
    renderFrame()
  })

  // Initial render
  renderFrame()

  // Start the renderer loop
  renderer.requestLive()
  renderer.start()

  // Game tick interval for auto-advance and timers
  setInterval(() => {
    renderFrame()
  }, 500)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
