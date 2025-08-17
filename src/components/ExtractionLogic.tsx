import React from 'react';
import './ExtractionLogic.component.css';
import Snowfall from './Snowfall';

export default function ExtractionLogic() {
  return (
    <div className="container-help-container">
      <Snowfall count={13} />
      <div className="container-help">
        <header>
          <span className="kicker">Chowaco • Extraction Logic</span>
        </header>

        {/* Section A: How It Flows (1→6) */}
        <section className="card">
          <h2>
            How It Flows <span className="kicker">1 → 6</span>
          </h2>

          {/* 1 */}
          <details open>
            <summary>
              <span className="num">1</span>
              <span className="title">Parse PDF → Get Raw Text</span>
              <span className="caret">›</span>
            </summary>
            <div className="content grid two">
              <div className="flow">
                <div className="node">
                  <h4>Input</h4>
                  <p>Uploaded PDF arrives with a document GUID.</p>
                  <div className="chips">
                    <span className="chip">application/pdf</span>
                    <span className="chip">GUID</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Parsing</h4>
                  <p>Extract text (and metadata) from pages.</p>
                  <div className="chips">
                    <span className="chip">pdf-parse</span>
                    <span className="chip">pdfUtils.js</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Output</h4>
                  <p>Normalized plain text ready for chunking.</p>
                  <div className="chips">
                    <span className="chip">utf-8</span>
                    <span className="chip">normalize()</span>
                  </div>
                </div>
              </div>
              <aside className="box">
                <h5>Step 1 Box</h5>
                <p>Reads the PDF and produces raw text for downstream steps.</p>
                <div className="kv">
                  <div className="k">Library</div>
                  <div className="v">pdf-parse</div>
                  <div className="k">Function</div>
                  <div className="v">utils/pdfUtils.js</div>
                  <div className="k">Why</div>
                  <div className="v">Reliable text extraction</div>
                </div>
              </aside>
            </div>
          </details>

          {/* 2 */}
          <details>
            <summary>
              <span className="num">2</span>
              <span className="title">Chunk + Embed</span>
              <span className="caret">›</span>
            </summary>
            <div className="content grid two">
              <div className="flow">
                <div className="node">
                  <h4>Chunking</h4>
                  <p>Split into overlapping windows to preserve context.</p>
                  <div className="chips">
                    <span className="chip">chunker.js</span>
                    <span className="chip">size: ~800–1,200</span>
                    <span className="chip">overlap: ~100–200</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Embeddings</h4>
                  <p>Create vectors per chunk for semantic search.</p>
                  <div className="chips">
                    <span className="chip">text-embedding-3-small</span>
                    <span className="chip">rag.js#getEmbeddings</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Persist</h4>
                  <p>Store &#123;chunk, vector, page, guid&#125;.</p>
                  <div className="chips">
                    <span className="chip">documentStore</span>
                    <span className="chip">upsert()</span>
                  </div>
                </div>
              </div>
              <aside className="box">
                <h5>Step 2 Box</h5>
                <p>Prepares text for fast semantic retrieval later.</p>
                <div className="kv">
                  <div className="k">Library</div>
                  <div className="v">OpenAI Embeddings</div>
                  <div className="k">Function</div>
                  <div className="v">utils/rag.js#getEmbeddings</div>
                  <div className="k">Why</div>
                  <div className="v">Vector search over chunks</div>
                </div>
              </aside>
            </div>
          </details>

          {/* 3 */}
          <details>
            <summary>
              <span className="num">3</span>
              <span className="title">Retrieve Relevant Chunks</span>
              <span className="caret">›</span>
            </summary>
            <div className="content grid two">
              <div className="flow">
                <div className="node">
                  <h4>Query Vector</h4>
                  <p>Embed the user question / anchored field prompt.</p>
                  <div className="chips">
                    <span className="chip">embed(query)</span>
                    <span className="chip">anchored fields</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Similarity</h4>
                  <p>Rank chunks via cosine similarity (top-k).</p>
                  <div className="chips">
                    <span className="chip">rag.js#searchChunks</span>
                    <span className="chip">cosine()</span>
                    <span className="chip">k=5~10</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Result Set</h4>
                  <p>Shortlist of the most relevant chunks.</p>
                  <div className="chips">
                    <span className="chip">MMR/filters (opt.)</span>
                    <span className="chip">dedupe pages</span>
                  </div>
                </div>
              </div>
              <aside className="box">
                <h5>Step 3 Box</h5>
                <p>
                  Finds the best evidence to answer the question accurately.
                </p>
                <div className="kv">
                  <div className="k">Library</div>
                  <div className="v">Custom cosine</div>
                  <div className="k">Function</div>
                  <div className="v">utils/rag.js#searchChunks</div>
                  <div className="k">Why</div>
                  <div className="v">Precision evidence set</div>
                </div>
              </aside>
            </div>
          </details>

          {/* 4 */}
          <details>
            <summary>
              <span className="num">4</span>
              <span className="title">Answer Extraction (JSON-only)</span>
              <span className="caret">›</span>
            </summary>
            <div className="content grid two">
              <div className="flow">
                <div className="node">
                  <h4>Prompt</h4>
                  <p>Build strict JSON schema prompt with citations.</p>
                  <div className="chips">
                    <span className="chip">system + user</span>
                    <span className="chip">schema-enforced</span>
                  </div>
                </div>
                <div className="node">
                  <h4>LLM Call</h4>
                  <p>Primary model with fallback + retry for validity.</p>
                  <div className="chips">
                    <span className="chip">llm.js#askWithRetry</span>
                    <span className="chip">valid JSON</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Validate</h4>
                  <p>Parse/validate JSON; reject malformed answers.</p>
                  <div className="chips">
                    <span className="chip">parseStrict()</span>
                    <span className="chip">zod/ajv (opt.)</span>
                  </div>
                </div>
              </div>
              <aside className="box">
                <h5>Step 4 Box</h5>
                <p>Ensures machine-readable, reliable outputs every time.</p>
                <div className="kv">
                  <div className="k">Library</div>
                  <div className="v">OpenAI Chat</div>
                  <div className="k">Function</div>
                  <div className="v">utils/llm.js#askWithRetry</div>
                  <div className="k">Why</div>
                  <div className="v">Structured answers</div>
                </div>
              </aside>
            </div>
          </details>

          {/* 5 */}
          <details>
            <summary>
              <span className="num">5</span>
              <span className="title">Storage & Links</span>
              <span className="caret">›</span>
            </summary>
            <div className="content grid two">
              <div className="flow">
                <div className="node">
                  <h4>Persist</h4>
                  <p>Save extracted fields + provenance.</p>
                  <div className="chips">
                    <span className="chip">documentStore</span>
                    <span className="chip">saveResult()</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Public Link</h4>
                  <p>Create shareable links when enabled.</p>
                  <div className="chips">
                    <span className="chip">createOpenLink()</span>
                    <span className="chip">GUID-scoped</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Cleanup</h4>
                  <p>Optional deletion/retention policy.</p>
                  <div className="chips">
                    <span className="chip">TTL/cron</span>
                  </div>
                </div>
              </div>
              <aside className="box">
                <h5>Step 5 Box</h5>
                <p>Makes results discoverable and lifecycle-managed.</p>
                <div className="kv">
                  <div className="k">Library</div>
                  <div className="v">Adapter (DB/S3)</div>
                  <div className="k">Function</div>
                  <div className="v">adapters/documentStore.js</div>
                  <div className="k">Why</div>
                  <div className="v">Durability + sharing</div>
                </div>
              </aside>
            </div>
          </details>

          {/* 6 */}
          <details>
            <summary>
              <span className="num">6</span>
              <span className="title">QA & Testing</span>
              <span className="caret">›</span>
            </summary>
            <div className="content grid two">
              <div className="flow">
                <div className="node">
                  <h4>Accuracy Harness</h4>
                  <p>Run evaluations over gold questions.</p>
                  <div className="chips">
                    <span className="chip">npm run accuracy</span>
                    <span className="chip">TESTING.md</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Logs</h4>
                  <p>Track retrieved set + JSON diffs.</p>
                  <div className="chips">
                    <span className="chip">debug logs</span>
                    <span className="chip">provenance</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Iterate</h4>
                  <p>Tune chunk size, k, prompts, models.</p>
                  <div className="chips">
                    <span className="chip">MMR</span>
                    <span className="chip">rerank</span>
                  </div>
                </div>
              </div>
              <aside className="box">
                <h5>Step 6 Box</h5>
                <p>
                  Closes the loop to continuously improve extraction quality.
                </p>
                <div className="kv">
                  <div className="k">Library</div>
                  <div className="v">Node + scripts</div>
                  <div className="k">Function</div>
                  <div className="v">/backend accuracy tools</div>
                  <div className="k">Why</div>
                  <div className="v">Measured progress</div>
                </div>
              </aside>
            </div>
          </details>
        </section>

        {/* Section B: Asking Stuff (1→5) */}
        <section className="card">
          <h2>
            Asking Stuff <span className="kicker">1 → 5</span>
          </h2>

          {/* 1 */}
          <details open>
            <summary>
              <span className="num">1</span>
              <span className="title">
                User Question → Field-Anchored Prompt
              </span>
              <span className="caret">›</span>
            </summary>
            <div className="content grid two">
              <div className="flow">
                <div className="node">
                  <h4>Intent</h4>
                  <p>Identify which field(s) the user wants.</p>
                  <div className="chips">
                    <span className="chip">field map</span>
                    <span className="chip">ReportIdentity</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Anchor</h4>
                  <p>Compose targeted cues to guide retrieval.</p>
                  <div className="chips">
                    <span className="chip">anchored terms</span>
                    <span className="chip">templates</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Embed</h4>
                  <p>Create query vector for search.</p>
                  <div className="chips">
                    <span className="chip">embed(query)</span>
                  </div>
                </div>
              </div>
              <aside className="box">
                <h5>Box 1</h5>
                <p>Turns free-form asks into precise, retrievable intents.</p>
                <div className="kv">
                  <div className="k">Function</div>
                  <div className="v">utils/extractText.js</div>
                  <div className="k">Why</div>
                  <div className="v">Reduce hallucinations</div>
                </div>
              </aside>
            </div>
          </details>

          {/* 2 */}
          <details>
            <summary>
              <span className="num">2</span>
              <span className="title">Retrieve Top Chunks</span>
              <span className="caret">›</span>
            </summary>
            <div className="content grid two">
              <div className="flow">
                <div className="node">
                  <h4>Search</h4>
                  <p>Cosine similarity over embedded chunks.</p>
                  <div className="chips">
                    <span className="chip">searchChunks()</span>
                    <span className="chip">k=5~10</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Filter</h4>
                  <p>MMR/dedupe by page, drop near-duplicates.</p>
                  <div className="chips">
                    <span className="chip">MMR</span>
                    <span className="chip">unique pages</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Context</h4>
                  <p>Bundle snippets with page refs.</p>
                  <div className="chips">
                    <span className="chip">provenance</span>
                  </div>
                </div>
              </div>
              <aside className="box">
                <h5>Box 2</h5>
                <p>Builds a small, high-signal evidence pack.</p>
                <div className="kv">
                  <div className="k">Function</div>
                  <div className="v">utils/rag.js#searchChunks</div>
                  <div className="k">Why</div>
                  <div className="v">Answer grounded in text</div>
                </div>
              </aside>
            </div>
          </details>

          {/* 3 */}
          <details>
            <summary>
              <span className="num">3</span>
              <span className="title">Call LLM (Strict JSON)</span>
              <span className="caret">›</span>
            </summary>
            <div className="content grid two">
              <div className="flow">
                <div className="node">
                  <h4>Schema</h4>
                  <p>Define fields and types the model must return.</p>
                  <div className="chips">
                    <span className="chip">JSON schema</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Ask</h4>
                  <p>Primary model; retry on invalid JSON.</p>
                  <div className="chips">
                    <span className="chip">llm.js#askWithRetry</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Citations</h4>
                  <p>Include source chunk IDs & pages.</p>
                  <div className="chips">
                    <span className="chip">page refs</span>
                    <span className="chip">GUID</span>
                  </div>
                </div>
              </div>
              <aside className="box">
                <h5>Box 3</h5>
                <p>Forces clean, machine-readable answers for UI/API.</p>
                <div className="kv">
                  <div className="k">Function</div>
                  <div className="v">utils/llm.js#askWithRetry</div>
                  <div className="k">Why</div>
                  <div className="v">Reliable automation</div>
                </div>
              </aside>
            </div>
          </details>

          {/* 4 */}
          <details>
            <summary>
              <span className="num">4</span>
              <span className="title">Validate & Store</span>
              <span className="caret">›</span>
            </summary>
            <div className="content grid two">
              <div className="flow">
                <div className="node">
                  <h4>Parse</h4>
                  <p>Strict parser rejects malformed JSON.</p>
                  <div className="chips">
                    <span className="chip">parseStrict()</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Persist</h4>
                  <p>Save result + provenance for later audit.</p>
                  <div className="chips">
                    <span className="chip">documentStore</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Expose</h4>
                  <p>Return to client or create open link.</p>
                  <div className="chips">
                    <span className="chip">createOpenLink()</span>
                  </div>
                </div>
              </div>
              <aside className="box">
                <h5>Box 4</h5>
                <p>Data becomes durable, queryable, and shareable.</p>
                <div className="kv">
                  <div className="k">Function</div>
                  <div className="v">adapters/documentStore.js</div>
                  <div className="k">Why</div>
                  <div className="v">Traceability</div>
                </div>
              </aside>
            </div>
          </details>

          {/* 5 */}
          <details>
            <summary>
              <span className="num">5</span>
              <span className="title">Render & Review</span>
              <span className="caret">›</span>
            </summary>
            <div className="content grid two">
              <div className="flow">
                <div className="node">
                  <h4>UI</h4>
                  <p>Show fields, confidence, and citations.</p>
                  <div className="chips">
                    <span className="chip">React</span>
                    <span className="chip">Charts (opt.)</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Feedback</h4>
                  <p>Flag issues; feed accuracy harness.</p>
                  <div className="chips">
                    <span className="chip">feedback()</span>
                    <span className="chip">gold set</span>
                  </div>
                </div>
                <div className="node">
                  <h4>Iterate</h4>
                  <p>Tune prompts, k, chunk sizes, models.</p>
                  <div className="chips">
                    <span className="chip">config.ts</span>
                  </div>
                </div>
              </div>
              <aside className="box">
                <h5>Box 5</h5>
                <p>Closes the UX loop and improves future answers.</p>
                <div className="kv">
                  <div className="k">Function</div>
                  <div className="v">frontend components</div>
                  <div className="k">Why</div>
                  <div className="v">Human-in-the-loop</div>
                </div>
              </aside>
            </div>
          </details>
        </section>

        <footer>
          Built by J, J | <a href="/">Go back to homepage, winter is coming!</a>
        </footer>
      </div>
    </div>
  );
}
