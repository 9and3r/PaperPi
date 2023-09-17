SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $SCRIPT_DIR
cd ../web
npm run build
mkdir -p ../paperpi/web_static/
rm -R ../paperpi/web_static/*
cp -R ./build/* ../paperpi/web_static