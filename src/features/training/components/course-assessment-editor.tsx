"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/forms/form-field";
import type { CourseAssessment } from "../schemas/course-schema";

export const newAssessment = (): CourseAssessment => ({
  title: "Training assessment",
  passingScore: 80,
  maxAttempts: 3,
  questions: [
    {
      type: "single_choice",
      text: "",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    },
  ],
});

export function CourseAssessmentEditor({
  value,
  onChange,
  prefix,
  errors,
}: {
  value: CourseAssessment;
  onChange: (value: CourseAssessment) => void;
  prefix: string;
  errors: Readonly<Record<string, string>>;
}) {
  const patchQuestion = (
    index: number,
    patch: Partial<CourseAssessment["questions"][number]>,
  ) =>
    onChange({
      ...value,
      questions: value.questions.map((question, i) =>
        i === index ? { ...question, ...patch } : question,
      ),
    });
  return (
    <div className="space-y-4">
      <FormField
        id={`${prefix}.title`}
        label="Assessment title"
        error={errors[`${prefix}.title`]}
      >
        <Input
          id={`${prefix}.title`}
          value={value.title}
          maxLength={255}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id={`${prefix}.passingScore`}
          label="Passing score (%)"
          error={errors[`${prefix}.passingScore`]}
        >
          <Input
            id={`${prefix}.passingScore`}
            type="number"
            min={0}
            max={100}
            value={value.passingScore}
            onChange={(e) =>
              onChange({ ...value, passingScore: Number(e.target.value) })
            }
          />
        </FormField>
        <FormField
          id={`${prefix}.maxAttempts`}
          label="Maximum attempts"
          error={errors[`${prefix}.maxAttempts`]}
        >
          <Input
            id={`${prefix}.maxAttempts`}
            type="number"
            min={1}
            max={10}
            value={value.maxAttempts}
            onChange={(e) =>
              onChange({ ...value, maxAttempts: Number(e.target.value) })
            }
          />
        </FormField>
      </div>
      {value.questions.map((question, index) => {
        const path = `${prefix}.questions.${index}`;
        return (
          <fieldset
            key={index}
            className="border-border space-y-3 rounded-lg border p-4"
          >
            <legend className="px-1 text-sm font-semibold">
              Question {index + 1}
            </legend>
            <FormField
              id={`${path}.text`}
              label="Question"
              error={errors[`${path}.text`]}
            >
              <Input
                id={`${path}.text`}
                maxLength={2000}
                value={question.text}
                onChange={(e) => patchQuestion(index, { text: e.target.value })}
              />
            </FormField>
            <FormField id={`${path}.type`} label="Answer type">
              <Select
                id={`${path}.type`}
                value={question.type}
                onChange={(e) =>
                  patchQuestion(index, {
                    type:
                      e.target.value === "multiple_choice"
                        ? "multiple_choice"
                        : "single_choice",
                    options: question.options.map((option) => ({
                      ...option,
                      isCorrect: false,
                    })),
                  })
                }
              >
                <option value="single_choice">Single correct answer</option>
                <option value="multiple_choice">
                  Multiple correct answers
                </option>
              </Select>
            </FormField>
            <p className="text-muted text-xs">
              {question.type === "single_choice"
                ? "Select exactly one correct answer."
                : "Select at least two correct answers."}
            </p>
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-start gap-2">
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type={question.type === "single_choice" ? "radio" : "checkbox"}
                    name={`${prefix}.questions.${index}.correct`}
                    className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2"
                    aria-label={`Correct answer ${optionIndex + 1} for question ${index + 1}`}
                    checked={option.isCorrect}
                    onChange={(e) =>
                      patchQuestion(index, {
                        options: question.options.map((item, i) => ({
                          ...item,
                          isCorrect:
                            i === optionIndex
                              ? e.target.checked
                              : question.type === "single_choice" &&
                                  e.target.checked
                                ? false
                                : item.isCorrect,
                        })),
                      })
                    }
                  />
                </label>
                <div className="min-w-0 flex-1">
                  <FormField
                    id={`${path}.options.${optionIndex}.text`}
                    label={`Answer ${optionIndex + 1}`}
                    error={errors[`${path}.options.${optionIndex}.text`]}
                  >
                    <Input
                      id={`${path}.options.${optionIndex}.text`}
                      maxLength={1000}
                      value={option.text}
                      onChange={(e) =>
                        patchQuestion(index, {
                          options: question.options.map((item, i) =>
                            i === optionIndex
                              ? { ...item, text: e.target.value }
                              : item,
                          ),
                        })
                      }
                    />
                  </FormField>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-6"
                  disabled={question.options.length <= 2}
                  aria-label={`Remove answer ${optionIndex + 1} from question ${index + 1}`}
                  onClick={() =>
                    patchQuestion(index, {
                      options: question.options.filter(
                        (_, i) => i !== optionIndex,
                      ),
                    })
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
            {errors[`${path}.options`] ? (
              <p role="alert" className="text-danger text-sm">
                {errors[`${path}.options`]}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={question.options.length >= 6}
                onClick={() =>
                  patchQuestion(index, {
                    options: [
                      ...question.options,
                      { text: "", isCorrect: false },
                    ],
                  })
                }
              >
                Add answer
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={value.questions.length <= 1}
                onClick={() =>
                  onChange({
                    ...value,
                    questions: value.questions.filter((_, i) => i !== index),
                  })
                }
              >
                Remove question
              </Button>
            </div>
          </fieldset>
        );
      })}
      <Button
        type="button"
        variant="secondary"
        disabled={value.questions.length >= 50}
        onClick={() =>
          onChange({
            ...value,
            questions: [...value.questions, ...newAssessment().questions],
          })
        }
      >
        Add question
      </Button>
    </div>
  );
}
