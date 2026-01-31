import { useState } from 'react';
import { Save } from 'lucide-react';

export default function PreferencesForm() {
    const [preferences, setPreferences] = useState({
        defaultVehicleType: 'CAR',
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        autoExtendParking: false,
    });

    const handleSave = () => {
        // Would call API to save preferences
        alert('Preferences saved successfully!');
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Save size={16} />
                    Save Changes
                </button>
            </div>

            <div className="space-y-6">
                {/* Default Vehicle Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Default Vehicle Type
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {['BIKE', 'SCOOTER', 'CAR', 'TRUCK'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setPreferences({ ...preferences, defaultVehicleType: type })}
                                className={`py-3 px-4 rounded-xl font-semibold transition-all capitalize ${preferences.defaultVehicleType === type
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {type.toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notifications */}
                <div>
                    <h3 className="font-bold text-gray-900 mb-3">Notification Preferences</h3>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors cursor-pointer">
                            <div>
                                <p className="font-semibold text-gray-900">Email Notifications</p>
                                <p className="text-sm text-gray-600">Receive booking confirmations and updates via email</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.emailNotifications}
                                onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                                className="w-5 h-5 text-indigo-600 rounded"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors cursor-pointer">
                            <div>
                                <p className="font-semibold text-gray-900">SMS Notifications</p>
                                <p className="text-sm text-gray-600">Get text messages for important updates</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.smsNotifications}
                                onChange={(e) => setPreferences({ ...preferences, smsNotifications: e.target.checked })}
                                className="w-5 h-5 text-indigo-600 rounded"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors cursor-pointer">
                            <div>
                                <p className="font-semibold text-gray-900">Push Notifications</p>
                                <p className="text-sm text-gray-600">Receive push notifications on your device</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.pushNotifications}
                                onChange={(e) => setPreferences({ ...preferences, pushNotifications: e.target.checked })}
                                className="w-5 h-5 text-indigo-600 rounded"
                            />
                        </label>
                    </div>
                </div>

                {/* Booking Preferences */}
                <div>
                    <h3 className="font-bold text-gray-900 mb-3">Booking Preferences</h3>
                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors cursor-pointer">
                        <div>
                            <p className="font-semibold text-gray-900">Auto-Extend Parking</p>
                            <p className="text-sm text-gray-600">Automatically extend parking when time is about to expire</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={preferences.autoExtendParking}
                            onChange={(e) => setPreferences({ ...preferences, autoExtendParking: e.target.checked })}
                            className="w-5 h-5 text-indigo-600 rounded"
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}
