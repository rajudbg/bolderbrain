import { NewTrainingForm, NewTrainingHeader } from "./new-training-form";
import {
  listBehavioralTemplatesForTraining,
  listOrgMembersForTraining,
  listTrainingContentTemplatesForOrg,
} from "../actions";

export default async function NewTrainingProgramPage() {
  const [templates, contentTemplates, members] = await Promise.all([
    listBehavioralTemplatesForTraining(),
    listTrainingContentTemplatesForOrg(),
    listOrgMembersForTraining(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <NewTrainingHeader />
      <NewTrainingForm templates={templates} contentTemplates={contentTemplates} members={members} />
    </div>
  );
}
