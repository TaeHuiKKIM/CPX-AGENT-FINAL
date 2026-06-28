export function getKeywordPatientResponse(scenario, doctorText) {
  const matchedNode = scenario?.script?.dialogs?.find((dialog) => dialog.keywords.some((kw) => doctorText.includes(kw)));
  return matchedNode?.response ?? scenario?.script?.fallback ?? '지금 너무 불안해서 어떤 말을 해야 할지 잘 모르겠습니다.';
}
