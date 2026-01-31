import WorkInProgressPage from '../../components/WorkInProgressPage';

export default function DashboardPage() {
    return (
        <WorkInProgressPage
            title="Provider Dashboard"
            description="The provider dashboard is currently under development. This will be your central hub for managing your parking facilities, viewing analytics, and monitoring operations in real-time."
            expectedFeatures={[
                "Real-time occupancy tracking across all your facilities",
                "Revenue analytics and financial reports",
                "Booking management and customer insights",
                "Automated alerts for maintenance and critical events",
                "Performance metrics and historical trends",
                "Staff management and access control",
            ]}
            backUrl="/provider/facilities"
            homeUrl="/"
        />
    );
}
