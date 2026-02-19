import { useState, useCallback, useEffect } from "react";

/** Inline SVG info-circle icon (no external dependencies). */
function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="white"
      className="bi bi-info-circle"
      viewBox="0 0 16 16"
    >
      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
      <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
    </svg>
  );
}

/** Section heading inside the dialog. */
function Heading({ children }: { readonly children: React.ReactNode }) {
  return (
    <h3
      style={{
        margin: "24px 0 8px",
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: 0.3,
        color: "#e0e0ff",
      }}
    >
      {children}
    </h3>
  );
}

/** A bullet-point feature entry. */
function Feature({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <li style={{ marginBottom: 10, lineHeight: 1.55 }}>
      <strong style={{ color: "#c4b5fd" }}>{title}:</strong> {children}
    </li>
  );
}

/** Floating info button + modal About dialog. */
export default function AboutDialog() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={toggle}
        aria-label="About this explorer"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 20,
          borderRadius: "50%",
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255, 255, 255, 0.5)",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          transition: "color 0.2s, background 0.2s",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <InfoIcon />
        </div>
      </button>

      {/* Modal overlay + dialog */}
      {open && (
        <div
          onClick={toggle}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="About Buddhabrot Explorer"
            style={{
              background: "rgba(75, 75, 81, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 16,
              maxWidth: "85%",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "28px 32px",
              color: "rgba(255, 255, 255, 0.82)",
              fontFamily: "system-ui, sans-serif",
              fontSize: 13,
              lineHeight: 1.6,
              boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: 0.5,
                }}
              >
                Buddhabrot Explorer
              </h2>
              <button
                onClick={toggle}
                aria-label="Close"
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.4)",
                  fontSize: 22,
                  cursor: "pointer",
                  padding: "0 4px",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <Heading>A Brief History</Heading>
            <p>
              The{" "}
              <a href="https://en.wikipedia.org/wiki/Buddhabrot">Buddhabrot</a>{" "}
              was first discovered and described by researcher{" "}
              <strong>Melinda Green</strong> in 1993. While exploring the
              Mandelbrot set, she realized that instead of just looking at which
              points &ldquo;escape,&rdquo; one could track the entire path
              (orbit) a point takes before it leaves. When these millions of
              paths are plotted together, a ghostly, meditative figure emerges
              that strikingly resembles a seated Buddha&mdash;hence the name.
            </p>

            <Heading>What You&rsquo;re Seeing</Heading>
            <p>
              While a standard Mandelbrot map is a{" "}
              <em>&ldquo;result,&rdquo;</em> the Buddhabrot is a{" "}
              <em>&ldquo;journey.&rdquo;</em>
            </p>
            <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
              <li style={{ marginBottom: 6 }}>
                <strong>The Mandelbrot:</strong> Asks &ldquo;Did this point
                escape?&rdquo; and colors the pixel.
              </li>
              <li>
                <strong>The Buddhabrot:</strong> Asks &ldquo;Where did this
                point go on its way out?&rdquo; and leaves a trail of light at
                every coordinate it visited.
              </li>
            </ul>

            <Heading>Features of This Explorer</Heading>
            <ul style={{ paddingLeft: 20, margin: "8px 0", listStyle: "none" }}>
              <Feature title="Quantum Entropy (CURBy)">
                To render this &ldquo;cloud of paths,&rdquo; we need millions of
                random numbers. This app uses the Colorado University Randomness
                Beacon (CURBy), which provides verifiable randomness generated
                via quantum entanglement. Your fractal isn&rsquo;t just a
                simulation; it&rsquo;s seeded by the fundamental
                unpredictability of the universe.
              </Feature>

              <Feature title="WebGPU &amp; TSL Power">
                This app utilizes WebGPU, the next generation of graphics on the
                web, and the Three Shading Language (TSL). This allows us to run
                millions of &ldquo;flight simulations&rdquo; per second directly
                on your GPU, providing a real-time, fluid experience.
              </Feature>

              <Feature title="The Nebulabrot (RGB Mode)">
                Just as astronomers use different filters to see gases in space,
                the Nebulabrot technique assigns different colors to different
                &ldquo;energy levels.&rdquo; By rendering three layers at low,
                medium, and high iterations and mapping them to Red, Green, and
                Blue, we reveal the complex internal anatomy of the fractal.
              </Feature>

              <Feature title="The Juddhabrot (4D Rotation)">
                The math behind the Buddhabrot actually exists in four
                dimensions. The Juddhabrot feature (named after researcher{" "}
                <strong>Lori Gardi</strong>) allows you to &ldquo;rotate&rdquo;
                the 4D object through our 3D perspective, revealing hidden
                symmetries and &ldquo;projections&rdquo; that are invisible in a
                flat 2D view.
              </Feature>

              <Feature title="Infinite Depth">
                Use the pan and zoom controls to dive into the recursive
                filaments. Adjust the Iteration Slider to trade broad, bright
                shapes for fine, ethereal details.
              </Feature>
            </ul>

            <p
              style={{
                marginTop: 16,
                padding: "10px 14px",
                background: "rgba(255, 200, 100, 0.08)",
                borderLeft: "3px solid rgba(255, 200, 100, 0.3)",
                fontSize: 12,
                lineHeight: 1.5,
                color: "rgba(255, 255, 255, 0.65)",
              }}
            >
              <strong style={{ color: "rgba(255, 220, 150, 0.9)" }}>
                Note on Zoom Limits:
              </strong>{" "}
              While fractals are mathematically infinite, this renderer uses
              32-bit floating-point precision (standard for real-time GPU
              graphics). Beyond approximately 5,000× magnification, numerical
              precision degrades and orbit point density becomes too sparse,
              causing the image to fade to black. This is a fundamental
              constraint of real-time GPU rendering, not a limitation of the
              fractal itself.
            </p>

            {/* Quote */}
            <blockquote
              style={{
                margin: "20px 0 4px",
                padding: "12px 16px",
                borderLeft: "3px solid rgba(196, 181, 253, 0.4)",
                fontStyle: "italic",
                color: "rgba(255, 255, 255, 0.55)",
                fontSize: 12,
              }}
            >
              &ldquo;The Buddhabrot is the shadow of the Mandelbrot set, a
              representation of the chaotic paths that lead to infinity.&rdquo;
            </blockquote>
          </div>
        </div>
      )}
    </>
  );
}
