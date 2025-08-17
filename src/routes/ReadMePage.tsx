import React from 'react';

/**
 * ArchitectureOnePager
 * A single React page that renders the end‑to‑end flow (UI ↔ Backend) as a clean, printable one‑pager.
 * Drop this into your app or export it to static HTML for README embedding.
 *
 * Styling: TailwindCSS (minimal, readable). No external UI libs required.
 */

export default function ArchitectureOnePager() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 text-neutral-900 dark:text-neutral-100">
      <header className="mb-10 border-b border-neutral-200 pb-6 dark:border-white/10">
        <h1 className="text-3xl font-semibold tracking-tight">
          End‑to‑End Flow (UI ↔ Backend)
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-300">
          A clean, shared mental model of how our <strong>frontend</strong>{' '}
          (React) talks to the <strong>backend</strong> (Netlify Functions/Node)
          from upload to Q&amp;A — plus helpful side flows. Scope is based on
          the extracted repos: <code>fe/</code> and <code>be/</code>.
        </p>
      </header>

      {/* 0) Quick Map */}
      <Section title="0) Quick Map" id="quick-map">
        <SubTitle>Frontend (React)</SubTitle>
        <UL>
          <LI>
            Routes: <Code>src/routes/NewPDF.tsx</Code>,{' '}
            <Code>src/routes/PDFReport.tsx</Code>,{' '}
            <Code>src/routes/Posts.tsx</Code>
          </LI>
          <LI>
            Components: <Code>UploadForm.tsx</Code>,{' '}
            <Code>UploadedReportsList.tsx</Code>,{' '}
            <Code>ExtractedReportsList.tsx</Code>, <Code>SourcesModal.tsx</Code>
            , <Code>Charts.tsx</Code>
          </LI>
          <LI>
            Hooks: <Code>useReportData.ts</Code>,{' '}
            <Code>usePdfReportOrchestrator.ts</Code>,{' '}
            <Code>useJobStatus.ts</Code>
          </LI>
          <LI>
            Services: <Code>api.ts</Code>, <Code>reports.service.ts</Code>,{' '}
            <Code>reportsIndex.service.ts</Code>, <Code>data.service.ts</Code>
          </LI>
        </UL>
        <SubTitle>Backend (Node on Netlify)</SubTitle>
        <UL>
          <LI>
            Entry: <Code>netlify/functions/*.js</Code> → <Code>src/app.js</Code>{' '}
            → <Code>src/controllers/*</Code> → <Code>src/services/*</Code> →{' '}
            <Code>src/utils/*</Code>
          </LI>
          <LI>
            Controllers: <Code>askController.js</Code>,{' '}
            <Code>uploadController.js</Code>, <Code>openLinkController.js</Code>
            , <Code>deleteController.js</Code>, <Code>healthController.js</Code>
          </LI>
          <LI>
            Services: <Code>documentService.js</Code>,{' '}
            <Code>embeddingService.js</Code>, <Code>openLinkService.js</Code>
          </LI>
          <LI>
            Utils (RAG): <Code>extractText.js</Code>, <Code>ocr.js</Code>,{' '}
            <Code>chunker.js</Code>, <Code>embeddings.js</Code>,{' '}
            <Code>rag.js</Code>, <Code>rerank.js</Code>,{' '}
            <Code>fieldAnchors.js</Code>, <Code>llm.js</Code>,{' '}
            <Code>quantity.js</Code>
          </LI>
          <LI>
            Orchestration: <Code>lib/pipeline.js</Code>,{' '}
            <Code>lib/jobs.js</Code>; background:{' '}
            <Code>netlify/functions/processPdf-background.js</Code>
          </LI>
        </UL>
      </Section>

      {/* Libraries */}
      <Section title="Libraries in Use" id="libraries">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <SubTitle>Frontend</SubTitle>
            <UL>
              <LI>React (core UI), TypeScript (type safety)</LI>
              <LI>React Router DOM (routing)</LI>
              <LI>TailwindCSS (utility‑first styling)</LI>
              <LI>Framer Motion (animations)</LI>
              <LI>Recharts (charts/graphs)</LI>
              <LI>shadcn/ui (UI primitives), Lucide‑react (icons)</LI>
              <LI>Jest + React Testing Library (testing)</LI>
            </UL>
          </div>
          <div>
            <SubTitle>Backend</SubTitle>
            <UL>
              <LI>
                Node.js, Netlify Functions (serverless), Express‑style router
              </LI>
              <LI>OpenAI SDK (LLM + embeddings)</LI>
              <LI>Supabase JS client (DB/storage)</LI>
              <LI>pdf‑parse / pdfjs‑dist (PDF parsing)</LI>
              <LI>tesseract.js (OCR)</LI>
              <LI>Zod/Ajv (schema validation), uuid, dotenv</LI>
              <LI>axios / node‑fetch (HTTP), Mocha/Jest (tests)</LI>
            </UL>
          </div>
        </div>
      </Section>

      {/* 1) Primary Flow */}
      <Section
        title="1) Primary User Flow — Upload → Ask → Read"
        id="primary-flow"
      >
        <SubTitle>1.1 Upload a PDF (UI → Backend)</SubTitle>
        <TwoCol>
          <Col>
            <H6>UI</H6>
            <OL>
              <LI>
                User opens <Code>NewPDF.tsx</Code>.
              </LI>
              <LI>
                <Code>UploadForm.tsx</Code> selects file &amp; meta.
              </LI>
              <LI>
                Client <Code>POST /api/upload</Code> via <Code>api.ts</Code>{' '}
                (FormData).
              </LI>
            </OL>
          </Col>
          <Col>
            <H6>Backend</H6>
            <OL>
              <LI>
                <Code>upload.js</Code> → <Code>app.js</Code> →{' '}
                <Code>uploadController.js</Code>
              </LI>
              <LI>
                <Code>extractText.js</Code>/<Code>ocr.js</Code> → parse text
              </LI>
              <LI>
                <Code>chunker.js</Code> → chunks + metadata
              </LI>
              <LI>
                <Code>embeddings.js</Code>/<Code>embeddingService.js</Code> →
                vectors
              </LI>
              <LI>
                <Code>documentStore.js</Code> persist; optional queue via{' '}
                <Code>processPdf‑background.js</Code> (returns{' '}
                <Code>jobId</Code>)
              </LI>
              <LI>
                Response: <Code>{'{ reportId, jobId? }'}</Code>
              </LI>
            </OL>
          </Col>
        </TwoCol>

        <SubTitle>1.2 Read / Explore the Report (UI)</SubTitle>
        <UL>
          <LI>
            <Code>PDFReport.tsx</Code> uses <Code>useReportData.ts</Code> to
            fetch and render Summary/Goals/BMPs/Pollutants.
          </LI>
          <LI>
            <Code>SourcesModal</Code> reveals per‑chunk provenance.
          </LI>
        </UL>

        <SubTitle>1.3 Ask a Question (UI → Backend)</SubTitle>
        <TwoCol>
          <Col>
            <H6>UI</H6>
            <UL>
              <LI>
                User enters question; client <Code>POST /api/ask</Code> with{' '}
                <Code>{'{ reportId, question }'}</Code>.
              </LI>
            </UL>
          </Col>
          <Col>
            <H6>Backend</H6>
            <UL>
              <LI>
                <Code>api.js</Code> → <Code>askController.js</Code>
              </LI>
              <LI>
                <Code>rag.js</Code> retrieve → <Code>rerank.js</Code>
              </LI>
              <LI>
                <Code>llm.js</Code> + <Code>schemas/answerSchemas.js</Code> →
                strict JSON
              </LI>
              <LI>
                Return <Code>{'{ answer, citations, confidence }'}</Code>
              </LI>
            </UL>
          </Col>
        </TwoCol>
      </Section>

      {/* 2) Side Flows */}
      <Section title="2) Side Flows (Support & Enhancements)" id="side-flows">
        <UL>
          <LI>
            <strong>Status & Health</strong> — <Code>GET /api/status</Code>{' '}
            (checks <Code>lib/jobs.js</Code>), <Code>GET /api/health</Code> (env
            + connectivity)
          </LI>
          <LI>
            <strong>Public/Open Links</strong> —{' '}
            <Code>POST /api/open-link</Code> (signed share URLs)
          </LI>
          <LI>
            <strong>Index / Lists</strong> — <Code>GET /api/reports</Code>,{' '}
            <Code>GET /api/reports/:id</Code>
          </LI>
          <LI>
            <strong>Delete</strong> — <Code>DELETE /api/reports/:id</Code>
          </LI>
          <LI>
            <strong>Accuracy Harness</strong> — <Code>scripts/accuracy.js</Code>
            , samples &amp; gold JSON
          </LI>
        </UL>
      </Section>

      {/* 3) Sequence Diagram */}
      <Section title="3) Sequence (Text Diagram)" id="sequence">
        <Pre>
          {`User
 │
 ▼
Frontend: UploadForm → api.ts (POST /api/upload)
 │                                        
 ├────────────────────────────────────────▶ Netlify: upload.js → uploadController
 │                                          ├─ extractText/ocr → chunker
 │                                          ├─ embeddings → store
 │                                          └─ (optional) enqueue to processPdf-background (jobId)
 │◀─────────────────────────────────────────┤
 │ 200 { reportId, jobId? }
 │
 ├─ if jobId: useJobStatus polls GET /api/status?jobId=…
 │
 ▼
Frontend: PDFReport (useReportData) → api.ts
 ├─ GET /api/reports/:id → render sections
 └─ POST /api/ask { reportId, question }
                                            
 ──────────────────────────────────────────▶ Netlify: api.js → askController
                                            ├─ rag → retrieve → rerank
                                            ├─ llm (schemas/answerSchemas) → JSON
                                            └─ return { answer, citations, confidence }
◀───────────────────────────────────────────
Render answer + SourcesModal`}
        </Pre>
      </Section>

      {/* 4) Data Contracts */}
      <Section title="4) Data Contracts (Typical)" id="contracts">
        <UL>
          <LI>
            <strong>POST /api/upload</strong> (multipart/form‑data) →{' '}
            <Code>{'{ reportId, jobId? }'}</Code>
          </LI>
          <LI>
            <strong>GET /api/status?jobId=…</strong> →{' '}
            <Code>{'{ jobId, state, progress?, error?, reportId? }'}</Code>
          </LI>
          <LI>
            <strong>GET /api/reports/:id</strong> → structured report JSON
          </LI>
          <LI>
            <strong>POST /api/ask</strong> →{' '}
            <Code>
              {'{ answer, citations: [{chunkId,page,span}], confidence }'}
            </Code>
          </LI>
          <LI>
            <strong>POST /api/open-link</strong> →{' '}
            <Code>{'{ url, expiresAt? }'}</Code>
          </LI>
        </UL>
      </Section>

      {/* 5) Operational Notes */}
      <Section title="5) Operational Notes" id="ops">
        <UL>
          <LI>
            <strong>Env</strong>: backend <Code>be/.env</Code>; frontend{' '}
            <Code>fe/.env*</Code> (e.g., <Code>REACT_APP_API_BASE</Code>).
          </LI>
          <LI>
            <strong>Netlify</strong>: <Code>netlify.toml</Code>. Heavy work →{' '}
            <Code>processPdf‑background.js</Code>.
          </LI>
          <LI>
            <strong>Provenance</strong>: keep <Code>page</Code>,{' '}
            <Code>bbox</Code>, <Code>section</Code> on each chunk.
          </LI>
          <LI>
            <strong>Reranking</strong>: <Code>rerank.js</Code> with MMR.
          </LI>
          <LI>
            <strong>JSON Strictness</strong>:{' '}
            <Code>schemas/answerSchemas.js</Code> + <Code>llm.js</Code>.
          </LI>
          <LI>
            <strong>Logs</strong>: requestId across upload &amp; ask.
          </LI>
        </UL>
      </Section>

      {/* 6) Fast Wins */}
      <Section title="6) What We Can Improve Next (Fast Wins)" id="wins">
        <UL>
          <LI>Front→Back types (Zod/TS)</LI>
          <LI>Streaming answers</LI>
          <LI>SSE/WebSocket job status</LI>
          <LI>Embedding cache by checksum</LI>
          <LI>Basic observability (latency, tokens)</LI>
        </UL>
      </Section>

      <footer className="mt-10 border-t border-neutral-200 pt-6 text-xs text-neutral-600 dark:border-white/10 dark:text-neutral-300">
        <p>
          © {new Date().getFullYear()} — Architecture One‑Pager. Minimal,
          printable, and README‑ready.
        </p>
      </footer>
    </div>
  );
}

// ——— UI bits ———

function Section({
  title,
  id,
  children,
}: React.PropsWithChildren<{ title: string; id?: string }>) {
  return (
    <section id={id} className="mb-10">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="prose prose-neutral mt-3 max-w-none dark:prose-invert">
        {children}
      </div>
    </section>
  );
}

function SubTitle({ children }: React.PropsWithChildren) {
  return (
    <h3 className="mt-4 text-base font-semibold tracking-tight">{children}</h3>
  );
}

function H6({ children }: React.PropsWithChildren) {
  return (
    <h6 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
      {children}
    </h6>
  );
}

function UL({ children }: React.PropsWithChildren) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm leading-6">{children}</ul>
  );
}

function OL({ children }: React.PropsWithChildren) {
  return (
    <ol className="list-decimal space-y-1 pl-5 text-sm leading-6">
      {children}
    </ol>
  );
}

function LI({ children }: React.PropsWithChildren) {
  return <li className="marker:text-neutral-400">{children}</li>;
}

function Code({ children }: React.PropsWithChildren) {
  return (
    <code className="rounded bg-neutral-100 px-1 py-0.5 text-[0.85em] dark:bg-neutral-800">
      {children}
    </code>
  );
}

function Pre({ children }: React.PropsWithChildren) {
  return (
    <pre className="overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed dark:border-white/10 dark:bg-neutral-900">
      {children}
    </pre>
  );
}

function TwoCol({ children }: React.PropsWithChildren) {
  return <div className="grid gap-6 sm:grid-cols-2">{children}</div>;
}

function Col({ children }: React.PropsWithChildren) {
  return <div className="space-y-2">{children}</div>;
}
