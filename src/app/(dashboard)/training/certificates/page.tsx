import {
  IssuedCertificatesManager,
  TrainingSectionNavigation,
} from "@/features/training";

export default function Page() {
  return (
    <IssuedCertificatesManager
      sectionNavigation={
        <TrainingSectionNavigation
          active="certificates"
          primaryLabel="Courses"
          showDepartmentReport={false}
          showIssuedCertificates
        />
      }
    />
  );
}
