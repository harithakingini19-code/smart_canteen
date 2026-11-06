import os
import sys

def main():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    print("--> Preparing Smart Canteen Backend Database...")
    os.system(f'"{sys.executable}" manage.py makemigrations accounts menu cart orders payments order_queue favorites reviews notifications')
    os.system(f'"{sys.executable}" manage.py migrate')
    print("--> Seeding initial canteen menu data...")
    os.system(f'"{sys.executable}" seed_data.py')
    print("\n--> Starting Django Backend Server at http://127.0.0.1:8000 ...")
    print("--> Keep this terminal open!\n")
    os.system(f'"{sys.executable}" manage.py runserver 8000')

if __name__ == '__main__':
    main()
