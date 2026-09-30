import { parseResponse } from "@/services/api";
import {
  formatCandidateDate,
  validateCandidateForm,
  type CandidateFormState,
} from "@/utils/candidate-form";

function makeResponse(
  status: number,
  payload: unknown,
  contentType = "application/json",
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": contentType }),
    json: jest.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe("parseResponse", () => {
  it("returns the JSON payload for a successful response", async () => {
    const payload = { total: 1, data: [{ id: "candidate-1" }] };

    await expect(parseResponse(makeResponse(200, payload))).resolves.toEqual(payload);
  });

  it("rejects with the API detail for an unsuccessful response", async () => {
    await expect(
      parseResponse(makeResponse(409, { detail: "El registro ya existe." })),
    ).rejects.toThrow("El registro ya existe.");
  });

  it("uses the HTTP status when an error response has no JSON body", async () => {
    await expect(
      parseResponse(makeResponse(503, null, "text/plain")),
    ).rejects.toThrow("HTTP 503");
  });
});

describe("validateCandidateForm", () => {
  const validValues: CandidateFormState = {
    full_name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+1 555 0100",
    position: "Analista",
    experience_years: "3",
  };

  it("accepts valid candidate details and trims surrounding whitespace for checks", () => {
    expect(
      validateCandidateForm({
        ...validValues,
        full_name: "  Ada Lovelace  ",
        email: " ada@example.com ",
      }),
    ).toEqual({});
  });

  it("rejects blank required fields, malformed email, and negative experience", () => {
    const errors = validateCandidateForm({
      ...validValues,
      full_name: "   ",
      email: "not-an-email",
      phone: " ",
      experience_years: "-1",
    });

    expect(errors).toMatchObject({
      full_name: expect.any(String),
      email: expect.any(String),
      phone: expect.any(String),
      experience_years: expect.any(String),
    });
  });

  it("accepts zero years of experience as a valid boundary value", () => {
    expect(
      validateCandidateForm({ ...validValues, experience_years: "0" }),
    ).toEqual({});
  });
});

describe("formatCandidateDate", () => {
  it("formats a valid ISO date using the Spanish locale and UTC", () => {
    expect(formatCandidateDate("2024-01-02T15:04:00.000Z")).toBe(
      "2 ene 2024, 15:04",
    );
  });

  it.each([undefined, null, "", "not-a-date"])(
    "returns a safe placeholder for an invalid or missing date (%s)",
    (value) => {
      expect(formatCandidateDate(value)).toBe("-");
    },
  );
});
