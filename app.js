import { examBank } from "./data/examBank.js";

const gradeSelect = document.getElementById("gradeSelect");
const subjectSelect = document.getElementById("subjectSelect");
const sectionSelect = document.getElementById("sectionSelect");
const loadBtn = document.getElementById("loadBtn");

const exerciseCard = document.getElementById("exerciseCard");
const exerciseTitle = document.getElementById("exerciseTitle");
const exerciseMeta = document.getElementById("exerciseMeta");
const exercisePrompt = document.getElementById("exercisePrompt");
const questionsList = document.getElementById("questionsList");
const questionArea = document.getElementById("questionArea");

const writingArea = document.getElementById("writingArea");
const writingAnswer = document.getElementById("writingAnswer");
const saveDraftBtn = document.getElementById("saveDraftBtn");
const checkStructureBtn = document.getElementById("checkStructureBtn");
const feedback = document.getElementById("feedback");
const draftList = document.getElementById("draftList");

const DRAFT_KEY = "np-traning-drafts";
let currentExercise = null;

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => (a > b ? 1 : -1));
}

function fillSelect(select, options) {
  select.innerHTML = "";
  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option;
    opt.textContent = option;
    select.appendChild(opt);
  });
}

function selectedFilters() {
  return {
    grade: Number(gradeSelect.value),
    subject: subjectSelect.value,
    section: sectionSelect.value
  };
}

function filteredExercises() {
  const { grade, subject, section } = selectedFilters();

  return examBank.filter(
    (exercise) =>
      exercise.grade === grade &&
      exercise.subject === subject &&
      exercise.section === section
  );
}

function renderExercise(exercise) {
  currentExercise = exercise;
  exerciseCard.classList.remove("hidden");
  exerciseTitle.textContent = exercise.title;
  exerciseMeta.textContent = `Åk ${exercise.grade} • ${exercise.subject} • ${exercise.section} • ${exercise.year}`;
  exercisePrompt.textContent = exercise.prompt;

  feedback.textContent = "";

  if (exercise.section === "Läsförståelse") {
    questionArea.classList.remove("hidden");
    writingArea.classList.add("hidden");
    questionsList.innerHTML = "";

    exercise.questions.forEach((question) => {
      const li = document.createElement("li");
      li.textContent = question;
      questionsList.appendChild(li);
    });
  } else {
    questionArea.classList.add("hidden");
    writingArea.classList.remove("hidden");
    writingAnswer.value = "";
  }
}

function loadExercise() {
  const [exercise] = filteredExercises();

  if (!exercise) {
    exerciseCard.classList.add("hidden");
    alert("Ingen uppgift hittades med ditt val. Lägg till fler i data/examBank.js.");
    return;
  }

  renderExercise(exercise);
}

function getDrafts() {
  return JSON.parse(localStorage.getItem(DRAFT_KEY) || "[]");
}

function saveDraft() {
  if (!currentExercise || currentExercise.section !== "Skrivdel") return;

  const text = writingAnswer.value.trim();
  if (!text) {
    feedback.textContent = "Skriv något innan du sparar utkast.";
    return;
  }

  const drafts = getDrafts();
  drafts.unshift({
    id: Date.now(),
    title: currentExercise.title,
    grade: currentExercise.grade,
    savedAt: new Date().toISOString(),
    wordCount: text.split(/\s+/).filter(Boolean).length,
    content: text
  });

  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts.slice(0, 8)));
  feedback.textContent = "Utkast sparat lokalt i webbläsaren.";
  renderDrafts();
}

function checkStructure() {
  if (!currentExercise || currentExercise.section !== "Skrivdel") return;

  const text = writingAnswer.value.trim();
  const words = text.split(/\s+/).filter(Boolean);

  if (words.length < 30) {
    feedback.textContent = "Texten är för kort för återkoppling. Skriv lite mer först.";
    return;
  }

  const sentenceCount = text.split(/[.!?]+/).filter((row) => row.trim()).length;
  const paragraphs = text.split(/\n\s*\n/).filter((row) => row.trim()).length;

  const hints = [];
  if (currentExercise.minWords && words.length < currentExercise.minWords) {
    hints.push(`Försök nå minst ${currentExercise.minWords} ord (nu: ${words.length}).`);
  }
  if (paragraphs < 3) {
    hints.push("Dela gärna upp texten i fler stycken för tydligare struktur.");
  }
  if (sentenceCount < 8) {
    hints.push("Utveckla resonemanget med fler fullständiga meningar.");
  }

  feedback.textContent =
    hints.length === 0
      ? `Bra struktur! (${words.length} ord, ${paragraphs} stycken)`
      : hints.join(" ");
}

function renderDrafts() {
  const drafts = getDrafts();
  draftList.innerHTML = "";

  if (drafts.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Inga utkast ännu.";
    draftList.appendChild(li);
    return;
  }

  drafts.forEach((draft) => {
    const li = document.createElement("li");
    const date = new Date(draft.savedAt).toLocaleString("sv-SE");
    li.textContent = `${draft.title} (Åk ${draft.grade}) – ${draft.wordCount} ord – sparad ${date}`;
    draftList.appendChild(li);
  });
}

function setupFilters() {
  const grades = uniqueSorted(examBank.map((item) => item.grade));
  fillSelect(gradeSelect, grades);

  const subjects = uniqueSorted(examBank.map((item) => item.subject));
  fillSelect(subjectSelect, subjects);

  const sections = uniqueSorted(examBank.map((item) => item.section));
  fillSelect(sectionSelect, sections);
}

loadBtn.addEventListener("click", loadExercise);
saveDraftBtn.addEventListener("click", saveDraft);
checkStructureBtn.addEventListener("click", checkStructure);

setupFilters();
renderDrafts();
loadExercise();
