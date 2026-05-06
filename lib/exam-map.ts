export const DEFAULT_EXAM_READINESS_SKILLS = {
  grammar_accuracy: {
    articles: "unknown",
    cases: "unknown",
    word_order: "unknown",
    verb_forms: "unknown",
    connectors: "unknown",
  },
  vocabulary: {
    household: "unknown",
    work: "unknown",
    appointments: "unknown",
    travel: "unknown",
    health: "unknown",
  },
  text_understanding: {
    task_instruction_decoding: "unknown",
    main_idea_detection: "unknown",
    detail_detection: "unknown",
    vocabulary_in_context: "unknown",
  },
  audio_understanding: {
    time_signal_detection: "unknown",
    action_detection: "unknown",
    reason_detection: "unknown",
    speaker_intention: "unknown",
  },
  writing: {
    situation_understanding: "unknown",
    formal_email_structure: "unknown",
    point_coverage: "unknown",
    register_control: "unknown",
    simple_sentence_accuracy: "unknown",
  },
  speaking: {
    self_introduction: "unknown",
    picture_description: "unknown",
    opinion_with_reason: "unknown",
    planning_dialogue: "unknown",
    question_response: "unknown",
  },
} as const;
