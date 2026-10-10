package io.ionic.starter;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattServer;
import android.bluetooth.BluetoothGattServerCallback;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.ParcelUuid;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Peripheral Android para el protocolo Exif BLE v1.
 * Se anuncia un servicio GATT, se espera consentimiento explícito ANTES de aceptar bytes.
 * No guarda la metadata en disco ni comunica con la API web.
 */
@CapacitorPlugin(name = "BleMetadataPeripheral", permissions = {
    @Permission(alias = "blePeripheral", strings = {
        Manifest.permission.BLUETOOTH_ADVERTISE, Manifest.permission.BLUETOOTH_CONNECT
    })
})
public class BleMetadataPeripheralPlugin extends Plugin {
    public static final UUID SERVICE_UUID = UUID.fromString("7d2ea28a-f7bd-485a-bd9d-92ad6ecfe93e");
    public static final UUID DATA_UUID = UUID.fromString("7d2ea28b-f7bd-485a-bd9d-92ad6ecfe93e");
    public static final UUID STATUS_UUID = UUID.fromString("7d2ea28c-f7bd-485a-bd9d-92ad6ecfe93e");
    public static final UUID CONTROL_UUID = UUID.fromString("7d2ea28d-f7bd-485a-bd9d-92ad6ecfe93e");
    private static final int MAX_BYTES = 12000;

    private BluetoothManager manager;
    private BluetoothGattServer server;
    private BluetoothLeAdvertiser advertiser;
    private AdvertiseCallback advertiseCallback;
    private PluginCall startCall;
    private BluetoothDevice connected;
    private String requestId;
    private String status = "PENDING";
    private boolean consented = false;
    private int expected = -1;
    private final ByteArrayOutputStream buffer = new ByteArrayOutputStream();

    private boolean permitted() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
            (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_ADVERTISE) == PackageManager.PERMISSION_GRANTED
            && ContextCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED);
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (!permitted()) {
            requestPermissionForAlias("blePeripheral", call, "onPermissions");
            return;
        }
        startAdvertising(call);
    }

    @PermissionCallback
    private void onPermissions(PluginCall call) {
        if (permitted()) startAdvertising(call);
        else call.reject("Permisos BLUETOOTH_ADVERTISE y BLUETOOTH_CONNECT denegados.");
    }

    @PluginMethod
    public synchronized void respond(PluginCall call) {
        String id = call.getString("requestId", "");
        Boolean accept = call.getBoolean("accept", false);
        if (connected == null || requestId == null || !requestId.equals(id)) {
            call.reject("Solicitud de conexión caducada.");
            return;
        }
        if (Boolean.TRUE.equals(accept)) {
            consented = true;
            status = "ACCEPTED";
            call.resolve();
        } else {
            status = "REJECTED";
            consented = false;
            call.resolve();
            try { server.cancelConnection(connected); } catch (Exception ignored) {}
        }
    }

    @PluginMethod
    public synchronized void stop(PluginCall call) {
        cleanUp();
        call.resolve();
    }

    private synchronized void startAdvertising(PluginCall call) {
        if (server != null || startCall != null) {
            call.reject("Ya está activa la recepción BLE.");
            return;
        }
        try {
            manager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
            BluetoothAdapter adapter = manager == null ? null : manager.getAdapter();
            if (adapter == null || !adapter.isEnabled()) {
                call.reject("Bluetooth desactivado o no disponible. Actívalo en Ajustes.");
                return;
            }
            advertiser = adapter.getBluetoothLeAdvertiser();
            if (advertiser == null || !getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE)) {
                call.reject("Este dispositivo no admite el modo periférico BLE.");
                return;
            }
            server = manager.openGattServer(getContext(), gattCallback);
            if (server == null) {
                call.reject("Android no pudo abrir el servidor GATT.");
                return;
            }
            BluetoothGattService service = new BluetoothGattService(SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY);
            service.addCharacteristic(new BluetoothGattCharacteristic(STATUS_UUID,
                BluetoothGattCharacteristic.PROPERTY_READ, BluetoothGattCharacteristic.PERMISSION_READ));
            service.addCharacteristic(new BluetoothGattCharacteristic(CONTROL_UUID,
                BluetoothGattCharacteristic.PROPERTY_WRITE, BluetoothGattCharacteristic.PERMISSION_WRITE));
            service.addCharacteristic(new BluetoothGattCharacteristic(DATA_UUID,
                BluetoothGattCharacteristic.PROPERTY_WRITE, BluetoothGattCharacteristic.PERMISSION_WRITE));
            startCall = call;
            if (!server.addService(service)) {
                startCall = null;
                cleanUp();
                call.reject("No se pudo registrar el servicio GATT.");
            }
        } catch (SecurityException e) {
            startCall = null;
            cleanUp();
            call.reject("Faltan permisos de Bluetooth: " + e.getMessage());
        } catch (Exception e) {
            startCall = null;
            cleanUp();
            call.reject("Error al iniciar BLE: " + e.getMessage());
        }
    }

    private final BluetoothGattServerCallback gattCallback = new BluetoothGattServerCallback() {
        @Override
        public void onServiceAdded(int code, BluetoothGattService service) {
            synchronized (BleMetadataPeripheralPlugin.this) {
                if (startCall == null) return;
                if (code != BluetoothGatt.GATT_SUCCESS) {
                    PluginCall pending = startCall;
                    startCall = null;
                    cleanUp();
                    pending.reject("Falló el registro del servicio BLE: " + code);
                    return;
                }
                try {
                    AdvertiseSettings settings = new AdvertiseSettings.Builder()
                        .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                        .setConnectable(true)
                        .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM)
                        .build();
                    AdvertiseData data = new AdvertiseData.Builder()
                        .addServiceUuid(new ParcelUuid(SERVICE_UUID))
                        .setIncludeDeviceName(false)
                        .build();
                    advertiseCallback = new AdvertiseCallback() {
                        @Override public void onStartSuccess(AdvertiseSettings settingsInEffect) {
                            synchronized (BleMetadataPeripheralPlugin.this) {
                                if (startCall != null) {
                                    startCall.resolve();
                                    startCall = null;
                                }
                            }
                        }
                        @Override public void onStartFailure(int errorCode) {
                            synchronized (BleMetadataPeripheralPlugin.this) {
                                PluginCall pending = startCall;
                                startCall = null;
                                cleanUp();
                                if (pending != null) pending.reject("Android no pudo anunciar BLE. Código: " + errorCode);
                            }
                        }
                    };
                    advertiser.startAdvertising(settings, data, advertiseCallback);
                } catch (Exception e) {
                    PluginCall pending = startCall;
                    startCall = null;
                    cleanUp();
                    pending.reject("Error al anunciar el servicio: " + e.getMessage());
                }
            }
        }

        @Override
        public void onConnectionStateChange(BluetoothDevice device, int code, int newState) {
            synchronized (BleMetadataPeripheralPlugin.this) {
                if (newState == BluetoothGatt.STATE_CONNECTED && code == BluetoothGatt.GATT_SUCCESS) {
                    if (connected != null && !connected.getAddress().equals(device.getAddress())) {
                        try { server.cancelConnection(device); } catch (Exception ignored) {}
                        return;
                    }
                    connected = device;
                    requestId = UUID.randomUUID().toString();
                    consented = false;
                    status = "PENDING";
                    expected = -1;
                    buffer.reset();
                    JSObject info = new JSObject();
                    info.put("requestId", requestId);
                    info.put("device", "Dispositivo Android cercano");
                    notifyListeners("incomingConnection", info, true);
                } else if (newState == BluetoothGatt.STATE_DISCONNECTED && connected != null
                    && connected.getAddress().equals(device.getAddress())) {
                    connected = null;
                    requestId = null;
                    consented = false;
                    expected = -1;
                    buffer.reset();
                    status = "PENDING";
                    notifyListeners("peerDisconnected", new JSObject(), true);
                }
            }
        }

        @Override
        public void onCharacteristicReadRequest(BluetoothDevice device, int requestId, int offset, BluetoothGattCharacteristic characteristic) {
            synchronized (BleMetadataPeripheralPlugin.this) {
                if (server == null) return;
                if (!STATUS_UUID.equals(characteristic.getUuid()) || connected == null
                    || !connected.getAddress().equals(device.getAddress())) {
                    server.sendResponse(device, requestId, BluetoothGatt.GATT_READ_NOT_PERMITTED, offset, null);
                    return;
                }
                byte[] bytes = status.getBytes(StandardCharsets.UTF_8);
                if (offset > bytes.length) {
                    server.sendResponse(device, requestId, BluetoothGatt.GATT_INVALID_OFFSET, offset, null);
                    return;
                }
                byte[] sliced = java.util.Arrays.copyOfRange(bytes, offset, bytes.length);
                server.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, sliced);
            }
        }

        @Override
        public void onCharacteristicWriteRequest(BluetoothDevice device, int requestId, BluetoothGattCharacteristic characteristic,
                                                  boolean preparedWrite, boolean responseNeeded, int offset, byte[] value) {
            synchronized (BleMetadataPeripheralPlugin.this) {
                int result = BluetoothGatt.GATT_SUCCESS;
                if (server == null) return;
                if (connected == null || !connected.getAddress().equals(device.getAddress()) ||
                    !consented || preparedWrite || offset != 0 || value == null) {
                    result = BluetoothGatt.GATT_WRITE_NOT_PERMITTED;
                } else if (CONTROL_UUID.equals(characteristic.getUuid())) {
                    try {
                        String command = new String(value, StandardCharsets.US_ASCII);
                        if (!command.startsWith("START:") || command.length() > 20) throw new Exception("Comando inválido");
                        int size = Integer.parseInt(command.substring(6));
                        if (size < 2 || size > MAX_BYTES) throw new Exception("Tamaño inválido");
                        expected = size;
                        buffer.reset();
                        status = "RECEIVING";
                    } catch (Exception e) {
                        result = BluetoothGatt.GATT_FAILURE;
                    }
                } else if (DATA_UUID.equals(characteristic.getUuid()) && expected >= 2 && "RECEIVING".equals(status)) {
                    if (value.length == 0 || buffer.size() + value.length > expected) {
                        result = BluetoothGatt.GATT_FAILURE;
                        status = "ERROR";
                    } else {
                        buffer.write(value, 0, value.length);
                        if (buffer.size() == expected) {
                            try {
                                String json = new String(buffer.toByteArray(), StandardCharsets.UTF_8);
                                JSONObject obj = new JSONObject(json);
                                JSObject event = new JSObject();
                                event.put("metadata", obj);
                                status = "RECEIVED";
                                notifyListeners("metadataReceived", event, true);
                            } catch (Exception e) {
                                status = "ERROR";
                                result = BluetoothGatt.GATT_FAILURE;
                            } finally {
                                buffer.reset();
                                expected = -1;
                            }
                        }
                    }
                } else {
                    result = BluetoothGatt.GATT_WRITE_NOT_PERMITTED;
                }
                if (responseNeeded) {
                    server.sendResponse(device, requestId, result, offset, null);
                }
            }
        }
    };

    private synchronized void cleanUp() {
        if (startCall != null) {
            startCall.reject("Recepción BLE cancelada.");
            startCall = null;
        }
        try {
            if (advertiser != null && advertiseCallback != null) advertiser.stopAdvertising(advertiseCallback);
        } catch (Exception ignored) {}
        advertiseCallback = null;
        try {
            if (server != null && connected != null) server.cancelConnection(connected);
        } catch (Exception ignored) {}
        try { if (server != null) server.close(); } catch (Exception ignored) {}
        server = null;
        connected = null;
        requestId = null;
        status = "PENDING";
        consented = false;
        expected = -1;
        buffer.reset();
    }

    @Override
    protected void handleOnDestroy() {
        cleanUp();
        super.handleOnDestroy();
    }
}
