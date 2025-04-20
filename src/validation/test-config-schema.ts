import { z } from "zod";

// Helper for numeric strings -> number or null
const numberOrNull = z.preprocess(
  (val) => (val === "" || val === null ? null : Number(val)),
  z.number().nullable()
);

// Helper for numeric strings -> number or undefined
const numberOrUndefined = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
  z.number().optional()
);

export const testConfigSchema = z
  .object({
    title: z.string().min(1, "Test name is required."),

    // Basic info toggles + fields
    useGrade: z.boolean().default(false),
    grade: z.string().optional(), // Optional string, could add .min(1) if required when useGrade=true via refine
    useSubject: z.boolean().default(false),
    subject: z.string().optional(),
    usePurpose: z.boolean().default(false),
    purpose: z.string().optional(),
    useDescription: z.boolean().default(false),
    description: z.string().optional(),

    // Type & Duration
    configType: z.enum(["test", "practice"]).default("test"),
    useDuration: z.boolean().default(false),
    testDuration: numberOrUndefined.refine(
      (val) => val === undefined || val >= 1, // Allow undefined or min 1
      { message: "Duration must be at least 1 minute." }
    ).refine(
      (val) => val === undefined || val <= 1440, // Optional max (e.g., 24 hours)
      { message: "Duration cannot exceed 1440 minutes (24 hours)." }
    ),

    // Access Settings
    useAccessTime: z.boolean().default(false),
    accessTimeFrom: z.string().optional(), // Keep as string for datetime-local input
    accessTimeTo: z.string().optional(),
    useAllowedTakers: z.boolean().default(false),
    allowedTakers: z.enum(["everyone", "byClass", "byStudent"]).default("everyone"),
    allowedStudents: z.string().optional(), // Will refine later if needed based on allowedTakers
    useAttempts: z.boolean().default(false),
    submittedTimes: numberOrUndefined.refine(
      (val) => val === undefined || val >= 1,
      { message: "Minimum 1 attempt." }
    ),

    // Security Settings
    usePassword: z.boolean().default(false),
    examPassword: z.string().optional(),
    questionAnswerMixed: z.boolean().default(false),
    shuffleQuestionAnswers: z.boolean().default(false),

    // Display Options
    showPoint: z.boolean().default(false),
    showCorrectAnswerOption: z.enum(["off", "on", "reach"]).default("off"),
    pointToShowAnswer: numberOrUndefined.refine(
      (val) => val === undefined || (val >= 0 && val <= 100),
      { message: "Score threshold must be between 0 and 100." }
    ),
    addHeaderInfo: z.boolean().default(false),
    headerInfo: z.string().optional(),
  })
  .refine(
    (data) => !data.useGrade || (data.useGrade && !!data.grade),
    { message: "Grade level is required when enabled.", path: ["grade"] }
  )
  .refine(
    (data) => !data.useSubject || (data.useSubject && !!data.subject),
    { message: "Subject is required when enabled.", path: ["subject"] }
  )
  .refine(
    (data) => !data.usePurpose || (data.usePurpose && !!data.purpose),
    { message: "Purpose is required when enabled.", path: ["purpose"] }
  )
  .refine(
    (data) => !data.useDescription || (data.useDescription && !!data.description),
    {
      message: "Description is required when enabled.",
      path: ["description"],
    }
  )
  .refine(
    (data) => !data.useDuration || (data.useDuration && data.testDuration !== undefined && data.testDuration !== null),
    {
      message: "Test duration is required when enabled.",
      path: ["testDuration"],
    }
  )
  .refine(
    (data) =>
      !data.useAccessTime ||
      (data.useAccessTime && !!data.accessTimeFrom && !!data.accessTimeTo),
    {
      message: "Both start and end times are required when enabled.",
      path: ["accessTimeFrom"], // Can point to one or make a general form error
    }
  )
  .refine(
    (data) =>
      !data.useAccessTime ||
      !data.accessTimeFrom ||
      !data.accessTimeTo ||
      new Date(data.accessTimeFrom) < new Date(data.accessTimeTo),
    {
      message: "Start time must be before end time.",
      path: ["accessTimeTo"],
    }
  )
 .refine(
    (data) =>
      !data.useAllowedTakers || data.allowedTakers !== "byStudent" || (data.allowedTakers === "byStudent" && !!data.allowedStudents),
    {
      message: "Student emails are required when 'By Student' is selected.",
      path: ["allowedStudents"],
    }
  )
  .refine(
    (data) => !data.useAttempts || (data.useAttempts && data.submittedTimes !== undefined && data.submittedTimes !== null),
    {
      message: "Max attempts is required when enabled.",
      path: ["submittedTimes"],
    }
  )
  .refine(
    (data) => !data.usePassword || (data.usePassword && !!data.examPassword),
    {
      message: "Exam password is required when enabled.",
      path: ["examPassword"],
    }
  )
  .refine(
    (data) =>
      data.showCorrectAnswerOption !== "reach" ||
      (data.showCorrectAnswerOption === "reach" && data.pointToShowAnswer !== undefined && data.pointToShowAnswer !== null),
    {
      message: "Score threshold is required when 'reach' is selected.",
      path: ["pointToShowAnswer"],
    }
  )
  .refine(
    (data) => !data.addHeaderInfo || (data.addHeaderInfo && !!data.headerInfo),
    {
      message: "Header content is required when enabled.",
      path: ["headerInfo"],
    }
  );


export type TestConfigFormData = z.infer<typeof testConfigSchema>; 