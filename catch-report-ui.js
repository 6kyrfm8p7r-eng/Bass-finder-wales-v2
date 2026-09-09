(function () {
  "use strict";

  /*
    Bass Finder Wales
    Catch Report UI

    This module provides:
    - Bass Activity display
    - Catch report form
    - Blank report form
    - Local storage through bass-activity.js

    It does not alter the existing scoring engine.
  */

  function getMarkId(mark) {
    return (
      mark?.id ||
      mark?.markId ||
      mark?.name ||
      ""
    );
  }

  function getMarkName(mark) {
    return (
      mark?.name ||
      mark?.markName ||
      "This mark"
    );
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getActivity(markId) {
    if (
      typeof window.calculateBassActivity !==
      "function"
    ) {
      return null;
    }

    try {
      return window.calculateBassActivity(
        markId
      );
    } catch (error) {
      console.warn(
        "Bass Activity unavailable:",
        error
      );

      return null;
    }
  }

  function activityLabel(activity) {
    if (!activity) {
      return "No recent data";
    }

    if (activity.label) {
      return activity.label;
    }

    const score =
      Number(activity.score) || 50;

    if (score >= 80) return "Very strong";
    if (score >= 65) return "Strong";
    if (score >= 50) return "Moderate";
    if (score >= 35) return "Quiet";

    return "Very quiet";
  }

  function renderActivity(mark) {
    const markId =
      getMarkId(mark);

    const activity =
      getActivity(markId);

    if (!activity) {
      return `
        <section class="activity-card">
          <div class="activity-top">
            <div>
              <div class="activity-title">
                🐟 Bass Activity
              </div>
              <div class="activity-label">
                Collecting recent reports
              </div>
            </div>
          </div>

          <div class="activity-note">
            Catch intelligence will appear here
            as reports are collected.
          </div>
        </section>
      `;
    }

    const score =
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            Number(activity.score) || 50
          )
        )
      );

    const catches =
      Number(activity.catches) || 0;

    const blanks =
      Number(activity.blanks) || 0;

    const reports =
      Number(activity.reports) || 0;

    const confidence =
      activity.confidence ||
      "low";

    return `
      <section class="activity-card">

        <div class="activity-top">

          <div>
            <div class="activity-title">
              🐟 Bass Activity
            </div>

            <div class="activity-label">
              ${escapeHtml(
                activityLabel(activity)
              )}
            </div>
          </div>

          <div class="activity-score">
            ${score}
            <span>/100</span>
          </div>

        </div>

        <div class="activity-bar">
          <div
            class="activity-fill"
            style="width:${score}%"
          ></div>
        </div>

        <div class="activity-stats">

          <div class="activity-stat">
            <strong>
              ${catches}
            </strong>
            <span>
              catches
            </span>
          </div>

          <div class="activity-stat">
            <strong>
              ${blanks}
            </strong>
            <span>
              blanks
            </span>
          </div>

          <div class="activity-stat">
            <strong>
              ${reports}
            </strong>
            <span>
              reports
            </span>
          </div>

        </div>

        <div class="activity-note">
          Confidence:
          <strong>
            ${escapeHtml(
              confidence
            )}
          </strong>
        </div>

      </section>
    `;
  }

  function renderReportButtons(mark) {
    const markId =
      getMarkId(mark);

    const markName =
      getMarkName(mark);

    return `
      <section class="report-actions">

        <button
          class="report-button report-catch"
          type="button"
          data-report-action="catch"
          data-mark-id="${escapeHtml(markId)}"
          data-mark-name="${escapeHtml(markName)}"
        >
          🎣 I CAUGHT A BASS
        </button>

        <button
          class="report-button report-blank"
          type="button"
          data-report-action="blank"
          data-mark-id="${escapeHtml(markId)}"
          data-mark-name="${escapeHtml(markName)}"
        >
          ⭕ I BLANKED
        </button>

      </section>
    `;
  }

  function reportForm(type, markId, markName) {
    const isCatch =
      type === "catch";

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    const now =
      new Date();

    const currentTime =
      `${String(
        now.getHours()
      ).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;

    return `
      <div
        class="report-modal"
        data-report-modal
      >

        <div
          class="report-modal-backdrop"
          data-report-close
        ></div>

        <div class="report-modal-panel">

          <div class="report-modal-header">

            <div>
              <div class="report-modal-title">
                ${
                  isCatch
                    ? "🎣 Report a Bass Catch"
                    : "⭕ Report a Blank"
                }
              </div>

              <div class="report-modal-mark">
                ${escapeHtml(markName)}
              </div>
            </div>

            <button
              type="button"
              class="report-modal-close"
              data-report-close
              aria-label="Close"
            >
              ×
            </button>

          </div>

          <form
            class="bass-report-form"
            data-report-form
            data-report-type="${isCatch ? "catch" : "blank"}"
            data-mark-id="${escapeHtml(markId)}"
            data-mark-name="${escapeHtml(markName)}"
          >

            <div class="form-group">

              <label class="form-label">
                Date
              </label>

              <input
                class="form-input"
                type="date"
                name="date"
                value="${today}"
                required
              >

            </div>

            <div class="form-group">

              <label class="form-label">
                Time
              </label>

              <input
                class="form-input"
                type="time"
                name="time"
                value="${currentTime}"
                required
              >

            </div>

            ${
              isCatch
                ? `
                  <div class="form-group">

                    <label class="form-label">
                      Number of bass
                    </label>

                    <input
                      class="form-input"
                      type="number"
                      name="fishCount"
                      min="1"
                      max="99"
                      value="1"
                      required
                    >

                  </div>

                  <div class="form-group">

                    <label class="form-label">
                      Biggest fish weight (lb)
                    </label>

                    <input
                      class="form-input"
                      type="number"
                      name="fishWeight"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="Optional"
                    >

                  </div>

                  <div class="form-group">

                    <label class="form-label">
                      Biggest fish length (cm)
                    </label>

                    <input
                      class="form-input"
                      type="number"
                      name="fishLength"
                      min="10"
                      max="150"
                      step="0.5"
                      placeholder="Optional"
                    >

                  </div>

                  <div class="form-group">

                    <label class="form-label">
                      Method
                    </label>

                    <select
                      class="form-select"
                      name="method"
                    >
                      <option value="">
                        Select method
                      </option>
                      <option value="Lure">
                        Lure
                      </option>
                      <option value="Bait">
                        Bait
                      </option>
                      <option value="Fly">
                        Fly
                      </option>
                      <option value="Other">
                        Other
                      </option>
                    </select>

                  </div>

                  <div class="form-group">

                    <label class="form-label">
                      Lure
                    </label>

                    <input
                      class="form-input"
                      type="text"
                      name="lure"
                      maxlength="100"
                      placeholder="Optional"
                    >

                  </div>
                `
                : ""
            }

            <div class="form-group">

              <label class="form-label">
                Notes
              </label>

              <textarea
                class="form-textarea"
                name="notes"
                maxlength="1000"
                placeholder="${
                  isCatch
                    ? "Anything useful about the catch?"
                    : "Anything useful about the blank?"
                }"
              ></textarea>

            </div>

            <button
              type="submit"
              class="report-submit"
            >
              ${
                isCatch
                  ? "SAVE CATCH REPORT"
                  : "SAVE BLANK REPORT"
              }
            </button>

          </form>

        </div>

      </div>
    `;
  }

  function openReportForm(
    type,
    markId,
    markName
  ) {
    closeReportForm();

    document.body.insertAdjacentHTML(
      "beforeend",
      reportForm(
        type,
        markId,
        markName
      )
    );

    const modal =
      document.querySelector(
        "[data-report-modal]"
      );

    if (modal) {
      requestAnimationFrame(() => {
        modal.classList.add(
          "report-modal-visible"
        );
      });
    }
  }

  function closeReportForm() {
    const modal =
      document.querySelector(
        "[data-report-modal]"
      );

    if (!modal) {
      return;
    }

    modal.remove();
  }

  function handleSubmit(form) {
    const type =
      form.dataset.reportType;

    const markId =
      form.dataset.markId;

    const markName =
      form.dataset.markName;

    const data =
      new FormData(form);

    const date =
      data.get("date");

    const time =
      data.get("time");

    const notes =
      String(
        data.get("notes") || ""
      ).trim();

    if (
      !date ||
      !time
    ) {
      alert(
        "Please enter the date and time."
      );

      return;
    }

    try {

      if (
        type === "catch" &&
        typeof window.addBassCatch ===
          "function"
      ) {

        window.addBassCatch({
          markId,
          markName,
          date,
          time,

          species: "Bass",

          fishCount:
            Number(
              data.get("fishCount")
            ) || 1,

          fishLength:
            data.get("fishLength")
              ? Number(
                  data.get(
                    "fishLength"
                  )
                )
              : null,

          fishWeight:
            data.get("fishWeight")
              ? Number(
                  data.get(
                    "fishWeight"
                  )
                )
              : null,

          method:
            data.get("method") ||
            null,

          lure:
            data.get("lure") ||
            null,

          notes,

          source: "user"
        });

      } else if (
        type === "blank" &&
        typeof window.addBassBlank ===
          "function"
      ) {

        window.addBassBlank({
          markId,
          markName,
          date,
          time,

          species: "Bass",

          method:
            data.get("method") ||
            null,

          notes,

          source: "user"
        });

      } else {

        throw new Error(
          "Bass activity functions are not available."
        );

      }

      closeReportForm();

      document.dispatchEvent(
        new CustomEvent(
          "bass-report-saved",
          {
            detail: {
              markId,
              markName,
              type
            }
          }
        )
      );

      alert(
        type === "catch"
          ? "🎣 Catch report saved."
          : "⭕ Blank report saved."
      );

    } catch (error) {

      console.error(
        "Unable to save bass report:",
        error
      );

      alert(
        "Sorry, the report could not be saved."
      );
    }
  }

  function bindEvents() {

    document.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            "[data-report-action]"
          );

        if (button) {

          openReportForm(
            button.dataset.reportAction,
            button.dataset.markId,
            button.dataset.markName
          );

          return;
        }

        if (
          event.target.closest(
            "[data-report-close]"
          )
        ) {
          closeReportForm();
        }
      }
    );

    document.addEventListener(
      "submit",
      event => {

        const form =
          event.target.closest(
            "[data-report-form]"
          );

        if (!form) {
          return;
        }

        event.preventDefault();

        handleSubmit(form);
      }
    );

    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Escape"
        ) {
          closeReportForm();
        }
      }
    );

    document.addEventListener(
      "bass-report-saved",
      event => {

        const markId =
          event.detail?.markId;

        if (
          typeof window.refreshBassActivity ===
          "function"
        ) {
          window.refreshBassActivity(
            markId
          );
        }
      }
    );
  }


  /*
    Public API
  */

  window.BassReportUI = {
    renderActivity,
    renderReportButtons,
    openReportForm,
    closeReportForm
  };

  /*
    Start event handling.
  */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      bindEvents
    );
  } else {
    bindEvents();
  }

})();
