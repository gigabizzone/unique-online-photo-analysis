"use client";

import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { profileSchema, type ProfileFormData } from "@/lib/schemas/profile";

// Step 1 of every analysis form (PRD §5.3): collects customer profile,
// emits the typed data on submit. The page above this owns whether to
// also upsert into the Customer table — this component is pure UI.
//
// The Zod schema lives in src/lib/schemas/profile.ts so it's importable
// from server-side API routes too (Next.js forbids dotting into a
// "use client" module from server code).
export { profileSchema, type ProfileFormData };

interface ProfileSectionProps {
  defaultValues?: Partial<ProfileFormData>;
  onSubmit: SubmitHandler<ProfileFormData>;
  submitLabel?: string;
  /** When the parent (e.g. CustomerSearch) wants to overwrite the fields */
  preset?: Partial<ProfileFormData> | null;
}

const FIELD_INPUT_CLS = cn(
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  // Force dark text on light input bg — inputs don't inherit `color` from
  // ancestor elements per browser UA stylesheets, so without this they'd
  // show as white-on-white inside the dashboard's text-white wrapper.
  "text-foreground placeholder:text-muted-foreground",
  "focus:outline-none focus:ring-2 focus:ring-ring",
  "disabled:opacity-50"
);

export function ProfileSection({
  defaultValues,
  onSubmit,
  submitLabel = "Submit and Next →",
  preset,
}: ProfileSectionProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "Male",
      email: "",
      whatsapp: "",
      ...defaultValues,
    },
  });

  // Allow parent to overwrite the form (e.g. when CustomerSearch selects
  // an existing customer). Reset keeps RHF's dirty/validation state sane.
  useEffect(() => {
    if (preset) {
      reset({
        firstName: preset.firstName ?? "",
        lastName: preset.lastName ?? "",
        gender: (preset.gender as ProfileFormData["gender"]) ?? "Male",
        email: preset.email ?? "",
        whatsapp: preset.whatsapp ?? "",
      });
    }
  }, [preset, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-4 rounded-xl border border-border bg-card text-card-foreground p-5 sm:p-6 shadow-sm"
    >
      <h2 className="text-base font-semibold">Customer profile</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium mb-1.5"
          >
            First name *
          </label>
          <input
            id="firstName"
            autoComplete="given-name"
            className={FIELD_INPUT_CLS}
            placeholder="Mukesh"
            {...register("firstName")}
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-destructive">
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium mb-1.5"
          >
            Last name *
          </label>
          <input
            id="lastName"
            autoComplete="family-name"
            className={FIELD_INPUT_CLS}
            placeholder="Shah"
            {...register("lastName")}
          />
          {errors.lastName && (
            <p className="mt-1 text-xs text-destructive">
              {errors.lastName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium mb-1.5">
            Gender *
          </label>
          <select
            id="gender"
            className={FIELD_INPUT_CLS}
            {...register("gender")}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && (
            <p className="mt-1 text-xs text-destructive">
              {errors.gender.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            Email *
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={FIELD_INPUT_CLS}
            placeholder="customer@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="whatsapp"
            className="block text-sm font-medium mb-1.5"
          >
            WhatsApp number *{" "}
            <span className="text-muted-foreground font-normal">
              (with country code, e.g. +919812345678)
            </span>
          </label>
          <input
            id="whatsapp"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            className={FIELD_INPUT_CLS}
            placeholder="+919812345678"
            {...register("whatsapp")}
          />
          {errors.whatsapp && (
            <p className="mt-1 text-xs text-destructive">
              {errors.whatsapp.message}
            </p>
          )}
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" variant="gold" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
