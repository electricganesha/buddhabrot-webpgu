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

/** Tab button for the dialog navigation */
function TabButton({
  active,
  onClick,
  children,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "rgba(255, 255, 255, 0.12)" : "transparent",
        border: "none",
        color: active ? "#ffffff" : "rgba(255, 255, 255, 0.5)",
        padding: "8px 16px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: active ? 600 : 500,
        fontSize: 13,
        transition: "all 0.2s ease-in-out",
        flex: 1,
      }}
    >
      {children}
    </button>
  );
}

type TabId = "history" | "technical" | "maths" | "mystical" | "credits";

/** Floating info button + modal About dialog. */
export default function AboutDialog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("history");

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
            aria-label="About Buddhabrot WebGPU Explorer"
            style={{
              background: "rgba(75, 75, 81, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 16,
              maxWidth: 600,
              width: "100%",
              height: "75vh",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              color: "rgba(255, 255, 255, 0.82)",
              fontFamily: "system-ui, sans-serif",
              fontSize: 13,
              lineHeight: 1.6,
              boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6)",
            }}
          >
            {/* Header Area (Fixed) */}
            <div style={{ padding: "28px 32px 0" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
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
                  Buddhabrot WebGPU Explorer
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

              {/* Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  background: "rgba(0, 0, 0, 0.2)",
                  padding: 6,
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <TabButton
                  active={activeTab === "history"}
                  onClick={() => setActiveTab("history")}
                >
                  History
                </TabButton>
                <TabButton
                  active={activeTab === "technical"}
                  onClick={() => setActiveTab("technical")}
                >
                  Technical
                </TabButton>
                <TabButton
                  active={activeTab === "maths"}
                  onClick={() => setActiveTab("maths")}
                >
                  Maths
                </TabButton>
                <TabButton
                  active={activeTab === "mystical"}
                  onClick={() => setActiveTab("mystical")}
                >
                  Mystical
                </TabButton>
                <TabButton
                  active={activeTab === "credits"}
                  onClick={() => setActiveTab("credits")}
                >
                  Credits
                </TabButton>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0 32px 28px",
              }}
            >
              {activeTab === "history" && (
                <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                  <Heading>A Brief History</Heading>
                  <p>
                    The{" "}
                    <a
                      href="https://superliminal.com/fractals/bbrot/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#c4b5fd", textDecoration: "none" }}
                    >
                      Buddhabrot
                    </a>{" "}
                    was first discovered and described by researcher{" "}
                    <strong>Melinda Green&nbsp;</strong> in 1993. While
                    exploring the Mandelbrot set, she realized that instead of
                    just looking at which points &ldquo;escape,&rdquo; one could
                    track the entire path (orbit) a point takes before it
                    leaves. When these millions of paths are plotted together, a
                    ghostly, meditative figure emerges that strikingly resembles
                    a seated Buddha&mdash;hence the name.
                  </p>

                  <Heading>What You&rsquo;re Seeing</Heading>
                  <p>
                    While a standard Mandelbrot map is a{" "}
                    <em>&ldquo;result,&rdquo;</em> the Buddhabrot is a{" "}
                    <em>&ldquo;journey.&rdquo;</em>
                  </p>
                  <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                    <li style={{ marginBottom: 6 }}>
                      <strong>The Mandelbrot:</strong> Asks &ldquo;Did this
                      point escape?&rdquo; and colors the pixel.
                    </li>
                    <li>
                      <strong>The Buddhabrot:</strong> Asks &ldquo;Where did
                      this point go on its way out?&rdquo; and leaves a trail of
                      light at every coordinate it visited.
                    </li>
                  </ul>

                  <blockquote
                    style={{
                      margin: "24px 0 4px",
                      padding: "12px 16px",
                      borderLeft: "3px solid rgba(196, 181, 253, 0.4)",
                      background: "rgba(196, 181, 253, 0.05)",
                      borderRadius: "0 8px 8px 0",
                      fontStyle: "italic",
                      color: "rgba(255, 255, 255, 0.65)",
                      fontSize: 13,
                    }}
                  >
                    &ldquo;The Buddhabrot is the shadow of the Mandelbrot set, a
                    representation of the chaotic paths that lead to
                    infinity.&rdquo;
                  </blockquote>
                </div>
              )}

              {activeTab === "technical" && (
                <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                  <Heading>Renderer Technologies</Heading>
                  <ul
                    style={{
                      paddingLeft: 0,
                      margin: "8px 0",
                      listStyle: "none",
                    }}
                  >
                    <Feature title="WebGPU & TSL Power">
                      This app utilizes WebGPU, the next generation of graphics
                      on the web, and the Three Shading Language (TSL). This
                      allows us to run millions of &ldquo;flight
                      simulations&rdquo; per second directly on your GPU,
                      providing a real-time, fluid experience.
                    </Feature>

                    <Feature title="Quantum Entropy (CURBy)">
                      To render this &ldquo;cloud of paths,&rdquo; we need
                      millions of random numbers. This app can use the Colorado
                      University Randomness Beacon (CURBy), which provides
                      verifiable randomness generated via quantum entanglement.
                    </Feature>
                  </ul>

                  <Heading>Exploration Modes</Heading>
                  <ul
                    style={{
                      paddingLeft: 0,
                      margin: "8px 0",
                      listStyle: "none",
                    }}
                  >
                    <Feature title="The Nebulabrot (RGB Mode)">
                      Just as astronomers use different filters to see gases in
                      space, the Nebulabrot technique assigns different colors
                      to different &ldquo;energy levels.&rdquo; By rendering
                      three layers at low, medium, and high iterations and
                      mapping them to Red, Green, and Blue, we reveal the
                      complex internal anatomy of the fractal.
                    </Feature>

                    <Feature title="The Juddhabrot (4D Rotation)">
                      The math behind the Buddhabrot actually exists in four
                      dimensions. The Juddhabrot feature allows you to
                      &ldquo;rotate&rdquo; the 4D object through our 3D
                      perspective, revealing hidden symmetries and
                      &ldquo;projections&rdquo; that are invisible in a flat 2D
                      view.
                    </Feature>

                    <Feature title="Infinite Depth">
                      Use the pan and zoom controls to dive into the recursive
                      filaments. Adjust the Iteration Slider to trade broad,
                      bright shapes for fine, ethereal details.
                    </Feature>

                    <Feature title="Real-time Orbit Tracking">
                      Hover over any coordinate while the Orbit Tracking toggle
                      is active to view the exact escape trajectory of that
                      mathematical point in real-time. This dynamic calculation
                      integrates alongside WebGPU zoom recomputations to show
                      the 2D plane projection of the mathematical orbit
                      interacting fluidly with the fractal rendering.
                    </Feature>
                  </ul>

                  <p
                    style={{
                      marginTop: 20,
                      padding: "12px 16px",
                      background: "rgba(255, 200, 100, 0.08)",
                      borderLeft: "3px solid rgba(255, 200, 100, 0.4)",
                      borderRadius: "0 8px 8px 0",
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    <strong style={{ color: "rgba(255, 220, 150, 0.9)" }}>
                      Note on Zoom Limits:
                    </strong>{" "}
                    While fractals are mathematically infinite, this renderer
                    uses 32-bit floating-point precision (standard for real-time
                    GPU graphics). Beyond approximately 5,000× magnification,
                    numerical precision degrades and orbit point density becomes
                    too sparse, causing the image to fade to black.
                  </p>
                </div>
              )}

              {activeTab === "maths" && (
                <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                  <Heading>The Mathematics of the Buddhabrot</Heading>
                  <p>
                    The Buddhabrot is rendered using the same core equation as
                    the Mandelbrot set: <br />
                    <strong style={{ fontFamily: "monospace", fontSize: 14 }}>
                      Z<sub>n+1</sub> = Z<sub>n</sub>
                      <sup>2</sup> + C
                    </strong>
                  </p>

                  <Heading>1. The Constant (C) and the Variable (Z)</Heading>
                  <p>
                    <strong>C</strong> is a complex number (representing a
                    randomly chosen point on the 2D plane).
                    <br />
                    <strong>Z</strong> is a complex number that always starts at
                    zero (0 + 0i).
                  </p>
                  <p>
                    In each iteration <em>n</em>, we square the current value of
                    Z and add our starting point C to get the new Z.
                  </p>

                  <Heading>2. Escape or Bound</Heading>
                  <p>
                    We repeat this equation hundreds or thousands of times. Two
                    things can happen to Z:
                  </p>
                  <ul
                    style={{
                      paddingLeft: 0,
                      margin: "8px 0",
                      listStyle: "none",
                    }}
                  >
                    <Feature title="It Remains Bounded">
                      The value of Z fluctuates but never gets too large. It is
                      locked inside the "Mandelbrot lake." We discard these
                      points completely for the Buddhabrot.
                    </Feature>
                    <Feature title="It Escapes to Infinity">
                      The value of Z eventually grows larger than 2 (its
                      distance from the origin). As soon as this happens, we
                      know this point C is a "diverging" point. This is the
                      crucial group for the Buddhabrot.
                    </Feature>
                  </ul>

                  <Heading>3. Tracing the Flight Path</Heading>
                  <p>
                    In a standard Mandelbrot, escaping points are colored based
                    on <em>how quickly</em> they escaped. But for the
                    Buddhabrot, we care about the <em>exact path</em> they took
                    to get there.
                  </p>
                  <p>
                    Once we know point C escapes, we reset Z back to zero and
                    run the exact same equation again. But this time, at every
                    single step, we plot the current coordinate of Z onto a 2D
                    grid and increment its brightness by 1.
                  </p>
                  <p>
                    By doing this millions of times from millions of random C
                    starting points, the grid starts to glow naturally in areas
                    where these orbital paths cross frequently, building up the
                    ghostly density map known as the Buddhabrot.
                  </p>
                </div>
              )}

              {activeTab === "mystical" && (
                <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                  <Heading>Digital Mysticism</Heading>
                  <p>
                    The &ldquo;mystical&rdquo; or &ldquo;esoteric&rdquo; side of
                    the Buddhabrot stems from the striking coincidence that a
                    purely mathematical formula, when visualized through the
                    lens of movement and trajectory, produces a figure so
                    clearly resembling a traditional Buddhist icon.
                  </p>
                  <p>
                    Because the Buddhabrot reveals the &ldquo;ghost&rdquo; or
                    the &ldquo;hidden&rdquo; behavior of the Mandelbrot set, it
                    has become a favorite subject for those exploring the
                    intersection of sacred geometry, digital mysticism, and
                    non-dual philosophy.
                  </p>

                  <Heading>
                    1. The &ldquo;Ghost&rdquo; in the Mandelbrot
                  </Heading>
                  <p>
                    In fractal geometry, the Mandelbrot set is often seen as a
                    map of &ldquo;fate&rdquo;&mdash;either a point is in the set
                    (order) or it escapes (chaos). The Buddhabrot, however,
                    visualizes the transient state.
                  </p>
                  <ul
                    style={{
                      paddingLeft: 0,
                      margin: "8px 0",
                      listStyle: "none",
                    }}
                  >
                    <Feature title="The Shadow of Escape">
                      It is often described as the &ldquo;shadow&rdquo; or the
                      &ldquo;soul&rdquo; of the Mandelbrot set. By plotting only
                      the points that escape, it shows that even in the process
                      of leaving &ldquo;order,&rdquo; there is a profound,
                      structured beauty.
                    </Feature>
                    <Feature title="The Hidden Symmetry">
                      Esoterically, this represents the idea that what we
                      perceive as &ldquo;void&rdquo; or &ldquo;noise&rdquo; (the
                      space outside the Mandelbrot set) actually contains an
                      intricate, divine structure that is simply invisible to
                      standard observation.
                    </Feature>
                  </ul>

                  <Heading>2. Digital Sacred Geometry</Heading>
                  <p>
                    The image&rsquo;s resemblance to a seated Buddha is not just
                    a pareidolia effect; the mathematical symmetry reflects
                    ancient spiritual symbols:
                  </p>
                  <ul
                    style={{
                      paddingLeft: 0,
                      margin: "8px 0",
                      listStyle: "none",
                    }}
                  >
                    <Feature title="The Dharmachakra">
                      The &ldquo;crowned&rdquo; head and the multi-layered
                      circles often resemble the Wheel of Dharma or Mandalas
                      used in meditation.
                    </Feature>
                    <Feature title="The Lotus Position">
                      The density distribution naturally forms a central core
                      with &ldquo;petals&rdquo; or &ldquo;shoulders&rdquo;
                      extending outward, mirroring the posture of a being in
                      deep samadhi (meditative absorption).
                    </Feature>
                  </ul>

                  <Heading>
                    3. Philosophical Parallel: Process vs. Result
                  </Heading>
                  <p>
                    The distinction between the Mandelbrot and the Buddhabrot
                    mirrors a core philosophical debate:
                  </p>
                  <ul
                    style={{
                      paddingLeft: 0,
                      margin: "8px 0",
                      listStyle: "none",
                    }}
                  >
                    <Feature title="Result-Oriented (Mandelbrot)">
                      You look at the final destination (Did it stay or go?).
                    </Feature>
                    <Feature title="Process-Oriented (Buddhabrot)">
                      You look at the journey. Every step of the path is
                      recorded and valued. This is often compared to the
                      Buddhist concept of Karma or Path, where the destination
                      is less important than the quality and nature of the
                      movement through space and time.
                    </Feature>
                  </ul>

                  <Heading>
                    4. The &ldquo;Juddhabrot&rdquo; and 4D Unity
                  </Heading>
                  <p>
                    The term Juddhabrot (named after Lori Gardi) highlights the
                    4D nature of the set. Esoterically, this is seen as a
                    metaphor for Higher Dimensions of Consciousness.
                  </p>
                  <ul
                    style={{
                      paddingLeft: 0,
                      margin: "8px 0",
                      listStyle: "none",
                    }}
                  >
                    <Feature title="Projection of Truth">
                      Just as a 3D object casts a 2D shadow, the Buddhabrot is
                      seen as a 2D &ldquo;shadow&rdquo; of a much
                      higher-dimensional truth.
                    </Feature>
                    <Feature title="Unity of Chaos and Order">
                      Rotating the 4D object shows that the &ldquo;Buddha&rdquo;
                      shape is just one perspective; as it turns, it morphs into
                      other complex forms, suggesting that &ldquo;Truth&rdquo;
                      changes depending on the observer&rsquo;s viewpoint.
                    </Feature>
                  </ul>

                  <Heading>
                    5. Quantum Interconnectedness (The CURBy Connection)
                  </Heading>
                  <p>
                    By using the CURBy randomness beacon, your specific app adds
                    a layer of modern mysticism.
                  </p>
                  <ul
                    style={{
                      paddingLeft: 0,
                      margin: "8px 0",
                      listStyle: "none",
                    }}
                  >
                    <Feature title="Quantum Entanglement">
                      Because your render is seeded by quantum entanglement,
                      every &ldquo;pixel&rdquo; of your Buddha is technically
                      connected to the fundamental randomness of the universe.
                    </Feature>
                    <Feature title="Non-Determinism">
                      Most computer fractals are &ldquo;fake&rdquo; in that they
                      are deterministic. By using CURBy, your Buddhabrot becomes
                      a living snapshot of universal entropy&mdash;a digital
                      form of &ldquo;divination&rdquo; where the universe itself
                      chooses where the light falls.
                    </Feature>
                  </ul>
                </div>
              )}

              {activeTab === "credits" && (
                <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                  <Heading>Inspiration & Discovery</Heading>
                  <ul
                    style={{
                      paddingLeft: 20,
                      margin: "8px 0",
                      lineHeight: 1.7,
                    }}
                  >
                    <li>
                      <strong>Melinda Green</strong>: First discovered and
                      described the Buddhabrot rendering technique in 1993.
                    </li>
                    <li>
                      <strong>Lori Gardi</strong>: Developed the
                      &ldquo;Juddhabrot&rdquo; concept, exploring the 4D nature
                      of these plots.
                    </li>
                  </ul>

                  <Heading>Powered By</Heading>
                  <ul
                    style={{
                      paddingLeft: 20,
                      margin: "8px 0",
                      lineHeight: 1.7,
                    }}
                  >
                    <li>
                      <strong>Three.js & WebGPU</strong>: The foundational 3D
                      library and modern graphics API.
                    </li>
                    <li>
                      <strong>CURBy (CU Randomness Beacon)</strong>: For true
                      quantum entropy.
                    </li>
                    <li>
                      <strong>React & TypeScript</strong>: Driving the UI
                      interaction.
                    </li>
                  </ul>

                  <Heading>Credits</Heading>
                  <ul
                    style={{
                      paddingLeft: 20,
                      margin: "8px 0",
                      lineHeight: 1.7,
                    }}
                  >
                    <li>
                      Implementation of the Buddhabrot WebGPU Explorer project
                      by{" "}
                      <a
                        href="https://www.christianmarques.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#c4b5fd", textDecoration: "none" }}
                      >
                        <strong>Christian Marques</strong>.
                      </a>
                    </li>
                  </ul>

                  <div
                    style={{
                      marginTop: 32,
                      paddingTop: 16,
                      borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                      textAlign: "center",
                      color: "rgba(255, 255, 255, 0.4)",
                      fontSize: 12,
                    }}
                  >
                    Buddhabrot WebGPU Explorer &copy; {new Date().getFullYear()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
