import WorkInProgressPage from '../../components/WorkInProgressPage';

export default function ManageFacilitiesPage() {
    return (
        <WorkInProgressPage
            title="Manage Facilities"
            description="Comprehensive facility management tools are coming soon. You'll be able to add, edit, and monitor all your parking facilities from this centralized interface."
            expectedFeatures={[
                "Add and configure new parking facilities",
                "Edit facility details, pricing, and operating hours",
                "Upload facility images and set amenities",
                "Configure parking slots by floor and vehicle type",
                "Set pricing rules and special offers",
                "Enable/disable facilities and manage availability",
                "View facility performance and occupancy statistics",
            ]}
            backUrl="/provider/dashboard"
            homeUrl="/"
        />
    );
}
