import { mockFacilities } from '@/data/mockData';

export default function TestMockData() {
    console.log("Mock Facilities:", mockFacilities);
    return (
        <div className="p-10 bg-orange-100 text-orange-900 border-4 border-orange-500">
            <h1 className="text-3xl font-bold">Mock Data Loaded!</h1>
            <p>Count: {mockFacilities?.length}</p>
        </div>
    );
}
