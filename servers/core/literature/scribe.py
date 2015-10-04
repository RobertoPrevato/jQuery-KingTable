import io
import sys
is_python3 = sys.version_info >= (3, 0)


class Scribe:

    @staticmethod
    def read(path):
        with io.open(path, mode="rt", encoding="utf-8") as f:
            s = f.read()
            # go to beginning
            f.seek(0)
        return s
        
    @staticmethod
    def read_beginning(path, lines):
        with io.open(path, mode="rt", encoding="utf-8") as f:
            s = f.read(lines)
            # go to beginning
            f.seek(0)
        return s
    
    @staticmethod
    def read_lines(path):
        with io.open(path, mode="rt", encoding="utf-8") as f:
            content = f.readlines()
        return content
        
    @staticmethod
    def write(contents, path):
        if is_python3:
            with open(path, mode="wt", encoding="utf-8") as f:
                # truncate previous contents
                f.truncate()
                f.write(contents)
        else:
            with io.open(path, mode="wt", encoding="utf-8") as f:
                # truncate previous contents
                f.truncate()
                f.write(contents.decode("utf8"))

    @staticmethod
    def write_lines(lines, path):
        if is_python3:
            with open(path, mode="wt", encoding="utf-8") as f:
                f.writelines([l + "\n" for l in lines])
        else:
            with io.open(path, mode="wt") as f:
                for line in lines:
                    f.writelines(line.decode("utf8") + "\n")

    @staticmethod
    def add_content(contents, path):
        if is_python3:
            with open(path, mode="a", encoding="utf-8") as f:
                f.writelines(contents)
        else:
            with io.open(path, mode="a") as f:
                f.writelines(contents.decode("utf8"))

